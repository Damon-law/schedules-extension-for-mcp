<!--
 * @Author: Damon Liu
 * @Date: 2025-05-06 11:10:50
 * @LastEditors: Damon Liu
 * @LastEditTime: 2025-06-06 17:02:37
 * @Description: 
-->
# MCP日程表 README

这个是一个支持MCP的日程表插件，在本地启动了一个`Express`服务（默认3001端口， 可在配置文件进行修改），提供给MCP Server进行通讯交互进行增删查。
Cursor和Trae在配置 MCP Server 后 在Chat中通过 “增加日程”、“今天三点提醒我抢票”、“每天中午十一点提醒我点外卖”、“帮我查询今天下午有什么安排”、 “删除第一个日程”等自然语言进行交互。 并在提醒时间到后在 `VSCode` 内进行提醒，点击后可查看日程详情。

MCP Server 地址：

1. Github: [Damon-law/mcp_server_for_schedules](https://github.com/Damon-law/mcp_server_for_schedules)
    
2. Gitee: [MCP日程表的MCPServer: 与MCP日程表（ VSCode/Trae/Cursor拓展） 交互的 MCP Server](https://gitee.com/damon592/mcp_server_for_schedules)
   
## 功能 Features
    
    - [x]  通过MCP新增日程 （一次性日程， 循环性日程： 每日、 每周、 每年）
    - [x]  通过MCP查询日程 
    - [x]  通过MCP删除日程
    - [ ]  通过MCP更改日程内容 （目前可以删了重建）
    - [×]  编辑器内定时提醒日程
    - [ ]  ...  

界面展示：
![MCP日程表.png](images/normal_ui.png)

常见IDE简易使用教程：


### Trae中使用

Trae中使用方法：
1. 安装插件
2. 配置MCP Server
   1.  ```js
        {
            "mcpServers": {
                "schedules": {
                // 配置了fnm的情况下 --port为指定端口，VSCode插件需与MCP Server 请求端口一致， 默认3001
                "command": "fnm exec --using=20.10.0 node 你的路径\\mcp_server_for_schedules\\build\\index.js --port 3001"
                // 正常node
                "command": "npx 你的路径\\mcp_server_for_schedules\\build\\index.js --port 3001"
                }
            }
        }
        ```

        ![MCP配置成功.png](images/trae_mcp_setting.png)

3. 再对下中选择智能体MCP即可使用
   1. ![MCP选择智能体.png](images/trae_select_mcp.png) 
   2. 新增日程提醒操作演示
      1.  新增循环日程
        -  ![新增循环日程.png](images/trae_add_everyday_mission.png)
      2.  新增一次性日程
        - ![新增一次性日程.png](images/trae_add_mission_normal.png)
      3.  显示提醒
        - ![提醒.png](images/trae_notice.png) 
      4.  查看提醒详情
        - ![查看提醒详情.png](images/trae_notice_detail.png)
      5.  查询日程
        - ![查询日程.png](images/trae_check_schedules.png)
        - ![查询日程TreeView.png](images/trae_check_schedules_tree_view.png)
      6.  删除日程
        -![删除日程.png](images/trae_delete_schedules.png)
4. 宣传册


\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## 使用要求 Requirements

MCP日程表的增删操作均有MCP Server通过http本地请求发起，因此需要先安装对应的 MCP Server：



## 拓展配置 Extension Settings

MCP日程表配置如下：

`schedules-for-mcp.serverPort`: `Express` 服务启动的端口，默认为`3001`。需要与`MCP Server`配置的一致.

## 已知问题 Known Issues

暂无

## 版本更新 Release Notes


### 0.0.1

初版发布

## 更多 More

本拓展开源。

详细内容和开发可查看掘金：

[赛博丁真Damon 的个人主页 - 动态 - 掘金](https://juejin.cn/user/4332493267283560)