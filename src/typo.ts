/*
 * @Author: Damon Liu
 * @Date: 2025-05-06 16:20:22
 * @LastEditors: Damon Liu
 * @LastEditTime: 2025-05-30 15:53:52
 * @Description: 
 */
export interface Schedule {
    id: string;
    title: string;
    start: string;
    end: string;
    type?: 'important' | 'normal' | 'minor' | 'meeting' | 'work' | 'study' | 'exercise' | 'entertainment' | 'shopping';
    reminder?: string;
    description?: string;
    allDay?: boolean;
    repeatType?: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
    repeatInterval?: number;
    repeatDays?: number[];
    repeatEnd?: string;
    hasNotified?: boolean;
    processStatus?: '已过期' | '进行中' | '未开始';
    processStatusPriority?: number;
}