/*
 * @Author: Damon Liu
 * @Date: 2025-05-06 15:30:20
 * @LastEditors: Damon Liu
 * @LastEditTime: 2025-06-16 15:34:15
 * @Description: 
 */
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const processStatusPriorityMap: { [key: string]: number } = {
    '[进行中]': 1,
    '[未开始]': 2,
    '[已过期]': 3,
    undefined: 4
};

// 展开日程
export function expandRecurringSchedules(schedules: any[], fromDate: string, toDate: string) {
    const result: any[] = [];
    const dFrom = dayjs(fromDate);
    const dTo = dayjs(toDate);
    const currentDate = dayjs();
    schedules.forEach(schedule => {
        if (!schedule.repeatType || schedule.repeatType === 'none') {
            let processStatus = '[]';
            const instanceStart = dayjs(schedule.start);
            const instanceEnd = dayjs(schedule.end);
            if (currentDate.isSameOrAfter(instanceStart) && currentDate.isSameOrBefore(instanceEnd)) {
                processStatus = '[进行中]';
            } else if (currentDate.isAfter(instanceEnd)) {
                processStatus = '[已过期]';
            } else if (currentDate.isBefore(instanceStart)) {
                processStatus = '[未开始]';
            }
            // 非循环日程，直接加入
            result.push({
                ...schedule,
                processStatus: processStatus,
                processStatusPriority: processStatusPriorityMap[processStatus],
            });
        } else {
            const originStart = dayjs(schedule.start);
            const originEnd = dayjs(schedule.end);
            const originReminder = schedule.reminder ? dayjs(schedule.reminder) : null;
            const repeatEnd = schedule.repeatEnd ? dayjs(schedule.repeatEnd) : dTo;
            const interval = schedule.repeatInterval || 1;

            // 计算循环起点
            let current = dFrom.isAfter(originStart) ? dFrom : originStart;
            /* // 只保留日期部分
            current = current.startOf('day'); */

            while (current.isSameOrBefore(dTo) && current.isSameOrBefore(repeatEnd)) {
                let shouldAdd = false;
                if (schedule.repeatType === 'daily') {
                    shouldAdd = true;
                } else if (schedule.repeatType === 'weekly') {
                    // repeatDays: [0,1,2,3,4,5,6] 0=周日
                    if (Array.isArray(schedule.repeatDays) && schedule.repeatDays.includes(current.day())) {
                        shouldAdd = true;
                    }
                } else if (schedule.repeatType === 'monthly') {
                    if (current.date() === originStart.date()) {
                        shouldAdd = true;
                    }
                }
                if (shouldAdd) {
                    // 用当前实例日期 + 原始 start 的时分秒
                    const instanceStart = current
                        .hour(originStart.hour())
                        .minute(originStart.minute())
                        .second(originStart.second())
                        .millisecond(originStart.millisecond());
                    const duration = originEnd.diff(originStart);
                    const instanceEnd = instanceStart.add(duration, 'millisecond');
                    let instanceReminder = '';
                    if (originReminder) {
                        const reminderOffset = originReminder.diff(originStart);
                        instanceReminder = instanceStart.add(reminderOffset, 'millisecond').toISOString();
                    }
                    let processStatus = '[]';
                    if (currentDate.isSameOrAfter(instanceStart) && currentDate.isSameOrBefore(instanceEnd)) {
                        processStatus = '[进行中]';
                    } else if (currentDate.isAfter(instanceEnd)) {
                        processStatus = '[已过期]';
                    } else if (currentDate.isBefore(instanceStart)) {
                        processStatus = '[未开始]';
                    }
                    result.push({
                        ...schedule,
                        start: instanceStart.toISOString(),
                        end: instanceEnd.toISOString(),
                        reminder: instanceReminder,
                        processStatus,
                        processStatusPriority: processStatusPriorityMap[processStatus],
                        // originalId: schedule.id
                    });
                }
                // 下一个循环
                if (schedule.repeatType === 'daily') {
                    current = current.add(interval, 'day');
                } else if (schedule.repeatType === 'weekly') {
                    current = current.add(1, 'day');
                } else if (schedule.repeatType === 'monthly') {
                    current = current.add(interval, 'month');
                } else {
                    break;
                }
            }
        }
    });
    return result;
}