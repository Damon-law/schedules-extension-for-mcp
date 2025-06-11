/*
 * @Author: Damon Liu
 * @Date: 2025-05-06 11:10:50
 * @LastEditors: Damon Liu
 * @LastEditTime: 2025-06-11 16:19:18
 * @Description: 
 */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import express from 'express';
import schedule from 'node-schedule';
import { expandRecurringSchedules } from './tool';
import { Schedule } from './typo';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { ThemeIcon, ThemeColor } from 'vscode';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// 穿线
function strikethrough(text: string) {
	return text.split('').map(c => c + '\u0336').join('');
}

// 事件类型
export const EVENT_TYPES = {
	IMPORTANT: {
		value: 'important',
		color: '#ff4d4f',
		text: '重要'
	},
	NORMAL: {
		value: 'normal',
		color: '#1890ff',
		text: '日常'
	},
	MINOR: {
		value: 'minor',
		color: '#52c41a',
		text: '次要'
	}
};

const SCHEDULE_KEY = 'schedules';

let server: any = null;	// 服务端

let extensionContext: vscode.ExtensionContext | null = null; 	// 上下文

let jobs: schedule.Job[] = [];	// 定时任务

// 存储
const store = {
	get: (key: string) => {
		if (!extensionContext) {
			return [];
		}
		return extensionContext.globalState.get(key);
	},
	set: (key: string, value: any) => {
		if (!extensionContext) {
			return;
		}
		extensionContext.globalState.update(key, value);
	}
};

// 清除所有定时任务
const clearAllJobs = () => {
	jobs.forEach(job => {
		job.cancel();
	});
	jobs = [];
};

// 显示提醒通知
const showReminderNotification = (scheduleItem: any) => {
	let message = `${dayjs(scheduleItem.reminder).format('HH:mm:ss')} 提醒：${scheduleItem.title} \n ${scheduleItem.description} `;
	if (scheduleItem.start) {
		const startStr = dayjs(scheduleItem.start).format('YYYY-MM-DD HH:mm:ss');
		message = `${message} \n 开始时间: ${startStr}`;
	}
	if (scheduleItem.end) {
		const endStr = dayjs(scheduleItem.end).format('YYYY-MM-DD HH:mm:ss');
		message = `${message} \n 结束时间: ${endStr}`;
	}
	message = `${message} \n 提醒时间：${scheduleItem.reminder}`;

	vscode.window.showInformationMessage(message, '查看详情').then(action => {
		if (action === '查看详情') {
			const channel = vscode.window.createOutputChannel('日程提醒');
			channel.clear();
			channel.appendLine(message);
			channel.show(true); // true 表示在右下角弹出
		}
	});
	scheduleTreeProvider?.refresh();
};

// 检查今日提醒
const checkTodayReminders = (schedules: any[]) => {
	//const schedules = store.get(SCHEDULE_KEY) as any[] || []
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	// 过滤出今天需要提醒的日程
	const todayReminders = expandRecurringSchedules(
		schedules,
		today.toISOString(),
		tomorrow.toISOString()
	).filter(scheduleItem => {
		if (!scheduleItem.reminder) {
			return false;
		}
		const reminderTime = new Date(scheduleItem.reminder);
		return reminderTime >= today && reminderTime < tomorrow && !scheduleItem.hasNotified;
	});

	// 为每个提醒创建定时任务
	todayReminders.forEach(scheduleItem => {
		const reminderTime = new Date(scheduleItem.reminder);
		const job = schedule.scheduleJob(scheduleItem.id, reminderTime, () => {
			showReminderNotification(scheduleItem);
			// 更新存储中的日程状态
			const updatedSchedules = schedules.map(s =>
				s.id === scheduleItem.id ? { ...s, hasNotified: true } : s
			);
			store.set(SCHEDULE_KEY, updatedSchedules);
			// 取消任务
			job.cancel();
		});
		jobs.push(job);
	});
};

// 检查单个日程是否需要提醒
const checkSingleReminder = (scheduleItem: any) => {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const reminderTime = new Date(scheduleItem.reminder);
	if (reminderTime >= today && reminderTime < tomorrow && !scheduleItem.hasNotified) {
		const job = schedule.scheduleJob(reminderTime, () => {
			showReminderNotification(scheduleItem);
			// 更新存储中的日程状态
			const schedules = store.get(SCHEDULE_KEY) as any[] || [];
			const updatedSchedules = schedules.map(s =>
				s.id === scheduleItem.id ? { ...s, hasNotified: true } : s
			);
			store.set(SCHEDULE_KEY, updatedSchedules);
			// 取消任务
			job.cancel();
			jobs = jobs.filter(j => j.name !== job.name);
		});
		return job;
	}
	return null;
};

// 初始化日程表
const initSchedule = (context: vscode.ExtensionContext) => {
	let schedules = context.globalState.get(SCHEDULE_KEY) as any[] || [];
	// 为空时初始化
	if (!schedules.length) {
		schedules = [];
		context.globalState.update(SCHEDULE_KEY, []);
	}
	checkTodayReminders(schedules);
};

/* function getTypeInfo(type: string) {
	switch (type) {
		case 'important': return { color: '#ff4d4f', text: '重要' };
		case 'minor': return { color: '#52c41a', text: '次要' };
		default: return { color: '#1890ff', text: '日常' };
	}
} */
// 事件类型对应的颜色分类
const TYPE_ICON_COLOR_MAP: Record<string, string> = {
	important: 'charts.red',
	normal: 'charts.blue',
	minor: 'charts.green'
};


// 日程表节点
class ScheduleTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly schedule?: Schedule
	) {
		super(label, collapsibleState);
		if (schedule) {
			const colorKey = TYPE_ICON_COLOR_MAP[schedule.type || 'normal'] || 'charts.blue';
			this.iconPath = new ThemeIcon('circle-filled', new ThemeColor(colorKey));
		}
	}
}

// 获取今天日程的数量
const getTodaySchedulesCount = () => {
	const schedules: Schedule[] = store.get(SCHEDULE_KEY) as Schedule[] || [];
	const today = dayjs();
	const todayStart = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss');
	const todayEnd = dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss');
	return expandRecurringSchedules(schedules, todayStart, todayEnd).filter(s => s.start && s.start.startsWith(today.format('YYYY-MM-DD'))).length;
};


class ScheduleTreeProvider implements vscode.TreeDataProvider<ScheduleTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<ScheduleTreeItem | undefined | void> = new vscode.EventEmitter<ScheduleTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<ScheduleTreeItem | undefined | void> = this._onDidChangeTreeData.event;

	// 对齐时间到周一
	alignToMonday(date: Date | string) {
		const now = dayjs(date);
		const day = now.day(); // 0=周日, 1=周一, ..., 6=周六
		const diffToMonday = day === 0 ? -6 : 1 - day; // 计算到周一的天数差
		return now.add(diffToMonday, 'day');
	}

	getTreeItem(element: ScheduleTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: ScheduleTreeItem): Thenable<ScheduleTreeItem[]> {
		if (!element) {
			// 根节点
			return Promise.resolve([
				new ScheduleTreeItem('今日日程', vscode.TreeItemCollapsibleState.Expanded),
				new ScheduleTreeItem('明日日程', vscode.TreeItemCollapsibleState.Collapsed),
				new ScheduleTreeItem('本周日程', vscode.TreeItemCollapsibleState.Collapsed)
			]);
		} else if (element.label === '今日日程') {
			return Promise.resolve(this.getTodaySchedules());
		} else if (element.label === '明日日程') {
			return Promise.resolve(this.getTomorrowSchedules());
		} else if (element.label === '本周日程') {
			return Promise.resolve(this.getWeekSchedules());
		} else if (element.schedule) {
			// 展开单个日程，显示详情
			return Promise.resolve(this.getScheduleDetailItems(element.schedule));
		} else {
			return Promise.resolve([]);
		}
	}
	// 获取今日日程详情
	getTodaySchedules(): ScheduleTreeItem[] {
		const schedules: Schedule[] = store.get(SCHEDULE_KEY) as Schedule[] || [];
		const today = dayjs();
		const todayStart = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss');
		const todayEnd = dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss');
		const items = expandRecurringSchedules(schedules, todayStart, todayEnd)
			.filter(s => s.start && s.start.startsWith(today.format('YYYY-MM-DD')))
			.map(s => new ScheduleTreeItem(`${s.processStatus} ${s.title} - ${s.start ? dayjs(s.start).format('HH:mm') : ''} ~ ${s.end ? dayjs(s.end).format('HH:mm') : ''}`, vscode.TreeItemCollapsibleState.Collapsed, s))
			.sort((a, b) => {
				// 根据优先级排序， 进行中， 未开始， 已过期
				const aPriority = a.schedule?.processStatusPriority || 4;
				const bPriority = b.schedule?.processStatusPriority || 4;
				if (aPriority !== bPriority) {
					return aPriority - bPriority;
				}
				const aStart = dayjs(a.schedule?.start);
				const bStart = dayjs(b.schedule?.start);
				return aStart.diff(bStart);
			});
		if(items.length === 0) {
			items.push(new ScheduleTreeItem('暂无日程', vscode.TreeItemCollapsibleState.None));
		}
		return items;
	}
	// 获取明日日程详情
	getTomorrowSchedules(): ScheduleTreeItem[] {
		const schedules: Schedule[] = store.get(SCHEDULE_KEY) as Schedule[] || [];
		const tomorrow = dayjs().add(1, 'day');
		const tomorrowStart = tomorrow.clone().startOf('day').toISOString();
		const tomorrowEnd = tomorrow.clone().endOf('day').toISOString();
		const items = expandRecurringSchedules(schedules, tomorrowStart, tomorrowEnd)
			.filter(s => s.start && s.start.startsWith(tomorrow.format('YYYY-MM-DD')))
			.map(s => new ScheduleTreeItem(`${s.processStatus} ${s.title} - ${s.start ? dayjs(s.start).format('HH:mm') : ''} ~ ${s.end ? dayjs(s.end).format('HH:mm') : ''}`, vscode.TreeItemCollapsibleState.Collapsed, s))
			.sort((a, b) => {
				const aPriority = a.schedule?.processStatusPriority || 4;
				const bPriority = b.schedule?.processStatusPriority || 4;
				if (aPriority !== bPriority) {
					return aPriority - bPriority;
				}
				const aStart = dayjs(a.schedule?.start);
				const bStart = dayjs(b.schedule?.start);
				return aStart.diff(bStart);
			});
		if (items.length === 0) {
			items.push(new ScheduleTreeItem('暂无日程', vscode.TreeItemCollapsibleState.None));
		}
		return items;
	}
	// 获取本周日程详情
	getWeekSchedules(): ScheduleTreeItem[] {
		const schedules: Schedule[] = store.get(SCHEDULE_KEY) as Schedule[] || [];
		const monday = this.alignToMonday(new Date()); 	// 对齐到周一
		const sundayEnd = monday.clone().add(6, 'day').endOf('day');

		const items = expandRecurringSchedules(schedules, monday.toISOString(), sundayEnd.toISOString())
			.filter(s => {
				const start = dayjs(s.start);
				return s.start && start.isSameOrBefore(sundayEnd) && start.isSameOrAfter(monday);
			})
			.map(s => new ScheduleTreeItem(`${s.processStatus} ${s.title} - ${s.start ? dayjs(s.start).format('YYYY-MM-DD HH:mm') : ''} ~ ${s.end ? dayjs(s.end).format('YYYY-MM-DD HH:mm') : ''}`, vscode.TreeItemCollapsibleState.Collapsed, s))
			.sort((a, b) => {
				const aPriority = a.schedule?.processStatusPriority || 4;
				const bPriority = b.schedule?.processStatusPriority || 4;
				if (aPriority !== bPriority) {
					return aPriority - bPriority;
				}
				const aStart = dayjs(a.schedule?.start);
				const bStart = dayjs(b.schedule?.start);
				return aStart.diff(bStart);
			});
		if (items.length === 0) {
			items.push(new ScheduleTreeItem('暂无日程', vscode.TreeItemCollapsibleState.None));
		}
		return items;
	}
	// 获取日程详情
	getScheduleDetailItems(schedule: Schedule): ScheduleTreeItem[] {
		const items: ScheduleTreeItem[] = [];
		// 起止时间
		const start = schedule.start ? dayjs(schedule.start).format('YYYY-MM-DD HH:mm:ss') : '';
		const end = schedule.end ? dayjs(schedule.end).format('YYYY-MM-DD HH:mm:ss') : '';
		items.push(new ScheduleTreeItem(`日程状态：${schedule.processStatus}`, vscode.TreeItemCollapsibleState.None))
		items.push(new ScheduleTreeItem(`开始时间: ${start}`, vscode.TreeItemCollapsibleState.None));
		items.push(new ScheduleTreeItem(`结束时间: ${end}`, vscode.TreeItemCollapsibleState.None));
		// 提醒时间
		const reminder = schedule.reminder ? dayjs(schedule.reminder).format('YYYY-MM-DD HH:mm:ss') : '';
		if (reminder) {
			let label = `提醒时间: ${reminder}`;
			if (schedule.hasNotified || dayjs().isAfter(dayjs(reminder))) {
				// 用 Unicode 删除线
				label = `提醒时间: ${strikethrough(reminder)}`;
			}
			items.push(new ScheduleTreeItem(label, vscode.TreeItemCollapsibleState.None));
		}
		// 详情
		if (schedule.description) {
			items.push(new ScheduleTreeItem(`详情: ${schedule.description}`, vscode.TreeItemCollapsibleState.None));
		}
		// 事件类型
		let typeText = schedule.type || 'normal';
		let typeInfo = Object.values(EVENT_TYPES).find(t => t.value === typeText);
		if (typeInfo) {
			const typeItem = new ScheduleTreeItem(`事件类型: ${typeInfo.text}`, vscode.TreeItemCollapsibleState.None);
			// 颜色处理（VSCode 只支持内置颜色，不能直接用 hex，可以用 ThemeColor 或 iconPath 自定义 SVG）
			typeItem.iconPath = new ThemeIcon('circle-filled', new ThemeColor(TYPE_ICON_COLOR_MAP[typeText] || 'charts.blue'));
			items.push(typeItem);
		} else {
			items.push(new ScheduleTreeItem(`事件类型: ${typeText}`, vscode.TreeItemCollapsibleState.None));
		}
		return items;
	}
	// 刷新
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

let scheduleTreeProvider: ScheduleTreeProvider | null = null;

// 启动server
function startServer() {
	if (server) {
		server.close();
		server = null;
		return ;
	}
	const config = vscode.workspace.getConfiguration('schedules-for-mcp');
	let port = config.get<number>('serverPort', 3001);	// 获取配置文件中的server Port
	const app = express();
	app.use(express.json());

	// 新建日程
	app.post('/api/schedules', (req, res) => {
		const schedules = store.get(SCHEDULE_KEY) as any[] || [];
		const newSchedule = {
			...req.body,
			id: Date.now().toString(), // 使用时间戳作为临时ID
			hasNotified: false
		};
		schedules.push(newSchedule);
		store.set(SCHEDULE_KEY, schedules);

		// 判断是否为循环任务
		if (newSchedule.repeatType && newSchedule.repeatType !== 'none') {
			// 只为今天范围内的实例创建提醒
			const today = dayjs().startOf('day');
			const tomorrow = today.add(1, 'day');
			const todayInstances = expandRecurringSchedules([newSchedule], today.toISOString(), tomorrow.toISOString());
			todayInstances.forEach(instance => {
				if (instance.reminder) {
					checkSingleReminder(instance);
				}
			});
		} else if (newSchedule.reminder) {
			// 非循环任务，直接创建提醒
			checkSingleReminder(newSchedule);
		}
		// 刷新日程表
		scheduleTreeProvider?.refresh();
		res.status(201).json(newSchedule);
	});

	// 根据起止时间查询日程
	app.get('/api/schedules/range', (req: any, res: any) => {
		try {
			const { start, end } = req.query;

			if (!start || !end) {
				return res.status(400).json({
					error: '请提供开始时间(start)和结束时间(end)参数'
				});
			}

			// 验证日期格式 YYYY-MM-DD HH:mm:ss
			const dateFormatRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
			if (!dateFormatRegex.test(start) || !dateFormatRegex.test(end)) {
				return res.status(400).json({
					error: '日期格式无效，请使用 YYYY-MM-DD HH:mm:ss 格式'
				});
			}

			const startDate = new Date(start.replace(' ', 'T'));
			const endDate = new Date(end.replace(' ', 'T'));

			if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
				return res.status(400).json({
					error: '无效的日期值'
				});
			}

			const schedules = store.get(SCHEDULE_KEY) as any[] || [];
			const rangeSchedules = expandRecurringSchedules(schedules, startDate.toISOString(), endDate.toISOString())
				.filter(schedule => {
					const scheduleDate = new Date(schedule.start);
					return scheduleDate >= startDate && scheduleDate <= endDate;
				})
				.sort((a, b) => {
					// 根据优先级排序， 进行中， 未开始， 已过期
					const aPriority = a.schedule?.processStatusPriority || 4;
					const bPriority = b.schedule?.processStatusPriority || 4;
					if (aPriority !== bPriority) {
						return aPriority - bPriority;
					}
					const aStart = dayjs(a?.start);
					const bStart = dayjs(b?.start);
					return aStart.diff(bStart);
				});;

			// 格式化返回的日期为 YYYY-MM-DD HH:mm:ss
			const formatDate = (date: Date) => {
				const pad = (num: number) => String(num).padStart(2, '0');
				return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
			};

			res.json({
				schedules: rangeSchedules.map(schedule => ({
					...schedule,
					start: formatDate(new Date(schedule.start)),
					end: formatDate(new Date(schedule.end)),
					reminder: schedule.reminder ? formatDate(new Date(schedule.reminder)) : null
				})),
				rangeInfo: {
					start: formatDate(startDate),
					end: formatDate(endDate),
					count: rangeSchedules.length
				}
			});
		} catch (error: any) {
			res.status(500).json({
				error: '服务器内部错误',
				message: error.message
			});
		}
	});

	// 删除日程
	app.delete('/api/schedules/:id', (req: any, res: any) => {
		const schedules = store.get(SCHEDULE_KEY) as any[] || [];
		const scheduleToDelete = schedules.find(s => s.id === req.params.id);

		if (!scheduleToDelete) {
			return res.status(404).json({ error: 'Schedule not found' });
		}
		else {
			console.log('未找到日程')
		}

		// 取消提醒任务（如果存在）
		const job = jobs.find(j => j?.name === scheduleToDelete.id);
		if (job) {
			job.cancel();
			jobs = jobs.filter(j => j?.name !== scheduleToDelete.id);
		}

		const filteredSchedules = schedules.filter(s => s.id !== req.params.id);
		store.set(SCHEDULE_KEY, filteredSchedules);
		scheduleTreeProvider?.refresh();
		vscode.window.showInformationMessage(`日程 ${scheduleToDelete.title} 已删除`);
		res.status(201).json({
			id: req.params.id,
			message: '删除成功'
		});
	});

	server = app.listen(port, () => {
		vscode.window.showInformationMessage(`MCP日程表服务已启动，端口：${port}`);
	}).on('error', (err: any) => {
		vscode.window.showErrorMessage(`MCP日程表服务启动失败，错误信息：${err.message}`);
	});
}

vscode.workspace.onDidChangeConfiguration((e) => {
	if (e.affectsConfiguration('schedules-for-mcp.serverPort')) {
		clearAllJobs();
		if(server) {
			server.close();
			server = null;
		}
		startServer();
	}
});

export function activate(context: vscode.ExtensionContext) {
	extensionContext = context;
	initSchedule(context);
	scheduleTreeProvider = new ScheduleTreeProvider();
	//const scheduleView =  vscode.window.registerTreeDataProvider('scheduleView', scheduleTreeProvider);
	const scheduleView =  vscode.window.createTreeView('scheduleView', { treeDataProvider:  scheduleTreeProvider });
	scheduleView.onDidChangeVisibility((e) => {
		if (e.visible) {
			scheduleTreeProvider?.refresh();
		}
	});
	if(!server) {
		startServer();
	}

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "schedules-for-mcp" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('schedules-for-mcp.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from schedules_for_mcp!');
	});

	const showScheduleDetail = vscode.commands.registerCommand('schedules-for-mcp.showScheduleDetail', () => {
		vscode.commands.executeCommand('workbench.view.extension.scheduleSidebar').then(() => {
			vscode.commands.executeCommand('vscode.openView', 'scheduleView');
		});
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(showScheduleDetail);

	const todaySchedulesCount = getTodaySchedulesCount();
	let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	if (todaySchedulesCount > 0) {
		statusBarItem.text = `$(calendar) ${todaySchedulesCount}个日程`;
		statusBarItem.command = 'schedules-for-mcp.showScheduleDetail';
		statusBarItem.show();
	}
	else {
		statusBarItem.text = `$(calendar) 今日无日程`;
		statusBarItem.command = 'schedules-for-mcp.showScheduleDetail';
		statusBarItem.show();
	}
	context.subscriptions.push(statusBarItem);
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (server) {
		server.close();
		server = null;
	}
}
