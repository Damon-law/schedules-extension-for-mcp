<!--
 * @Author: Damon Liu
 * @Date: 2025-05-06 11:10:50
 * @LastEditors: Damon Liu
 * @LastEditTime: 2025-06-20 17:54:25
 * @Description: 
-->
# MCP日程表 README

这个是一个支持MCP的日程表插件，使用了`libp2p`技术和`mDNS`协议实现**局域网内的对等网络**和配套的`MCP Server`进行通讯交互， 提供**增、删、查**取日程的功能。

Cursor和Trae在配置 MCP Server 后 在Chat中通过 “增加日程”、“今天三点提醒我抢票”、“每天中午十一点提醒我点外卖”、“帮我查询今天下午有什么安排”、 “删除第一个日程”等自然语言进行交互。 并在提醒时间到后在 `VSCode` 内进行提醒，点击后可查看日程详情。

**MCP Server** 地址：

1. Github: [Damon-law/mcp_server_for_schedules](https://github.com/Damon-law/mcp_server_for_schedules)
    
2. Gitee: [MCP日程表的MCPServer: 与MCP日程表（ VSCode/Trae/Cursor拓展） 交互的 MCP Server](https://gitee.com/damon592/mcp_server_for_schedules)
   
## 功能 Features
    
    - [x]  通过MCP新增日程 （一次性日程， 循环性日程： 每日、 每周、 每年）
    - [x]  通过MCP查询日程 
    - [x]  通过MCP删除日程
    - [x]  通过MCP清空日程
    - [ ]  通过MCP更改日程内容 （目前可以删了重建）
    - [x]  编辑器内定时提醒日程
    - [ ]  ...  


界面展示：


![MCP日程表.png](images/normal_ui.png)




常见编辑器简易使用教程：

### Cursor中使用
Cursor中使用方法：
1. **安装插件**
2. **配置MCP Server**
    ```js
        {
            "mcpServers": {
                "schedules": {
                // 配置了fnm的情况下，先指定你使用的node版本
                "command": "fnm exec --using=20.10.0 node 你的路径\\mcp_server_for_schedules\\build\\index.js"
                // 正常node
                "command": "node 你的路径\\mcp_server_for_schedules\\build\\index.js"
                }
            }
        }
    ```
    ![MCP配置成功.png](images/cursor_mcp_setting.png)


3. **新增循环日程**


    ![新增循环日程.png](images/cursor_add_everyday_mission.png)

    

4. **新增一次性日程**
     

    ![新增一次性日程.png](images/cursor_add_mission_normal.png)


5.  **到时间显示提醒**
   

    ![提醒.png](images/cursor_notice.png)


6.  **查看提醒详情**
      

    ![查看提醒详情.png](images/cursor_notice_detail.png)

7.  **查询日程**

    ![查询日程.png](images/cursor_check_shedules.png)

    ![查询日程TreeView.png](images/cursor_check_schedules_tree_view.png)


8.  **删除日程**

    ![删除日程.png](images/cursor_delete_schedules.png)




### Trae中使用

Trae中使用方法：

`Trae` **中的 通知好像是默认设置为勿打扰模式，需要手动打开通知：**


![打开通知.png](images/trae_open_alert.png)


1. **安装插件**
2. **配置MCP Server**
    ```js
        {
            "mcpServers": {
                "schedules": {
                // 配置了fnm的情况下，先指定你使用的node版本
                "command": "fnm exec --using=20.10.0 node 你的路径\\mcp_server_for_schedules\\build\\index.js"
                // 正常node
                "command": "node 你的路径\\mcp_server_for_schedules\\build\\index.js"
                }
            }
        }
    ```

    ![MCP配置成功.png](images/trae_mcp_setting.png)

3. **再对下中选择智能体MCP即可使用**
   
   
   ![MCP选择智能体.png](images/trae_select_mcp.png) 
  

4. **新增循环日程**
  
   ![新增循环日程.png](images/trae_add_everyday_mission.png)


5. **新增一次性日程**


   ![新增一次性日程.png](images/trae_add_mission_normal.png)



6.  **到时间显示提醒**


    ![提醒.png](images/trae_notice.png) 


7.  **查看提醒详情**


    ![查看提醒详情.png](images/trae_notice_detail.png)


8.  **查询日程**

    ![查询日程.png](images/trae_check_schedules.png)

    ![查询日程TreeView.png](images/trae_check_schedules_tree_view.png)

9.  **删除日程**

    ![删除日程.png](images/trae_delete_schedules.png)

10. **清空所有日程** 

    ![清空日程.png](images/trae_clear_all_schedules.png)

## 使用要求 Requirements


**MCP日程表**的增、删、查操作均由`MCP Server`通过`libp2p`建立的对等网络通讯，因此需要先安装对应的 `MCP Server`：

1. Github: [Damon-law/mcp_server_for_schedules](https://github.com/Damon-law/mcp_server_for_schedules)
    
2. Gitee: [MCP日程表的MCPServer: 与MCP日程表（ VSCode/Trae/Cursor拓展） 交互的 MCP Server](https://gitee.com/damon592/mcp_server_for_schedules)

下载到本地后

```bash
pnpm install
```
或

```bash
npm  install
```

然后

```bash
pnpm build
```

或

```bash
npm  run build
```

编译完成后，在 `build` 文件夹下会生成一个 `index.js` 文件，这就是我们需要的 `MCP Server`.

在对应的IDE内配置MCP Server:

 ```js
        {
            "mcpServers": {
                "schedules": {
                // 配置了fnm的情况下，先指定你使用的node版本
                "command": "fnm exec --using=20.10.0 node 你的路径\\mcp_server_for_schedules\\build\\index.js"
                // 正常node
                "command": "node 你的路径\\mcp_server_for_schedules\\build\\index.js"
                }
            }
        }
```

## 拓展配置 Extension Settings

暂无

## 已知问题 Known Issues

暂无

## 版本更新 Release Notes

### 0.0.4 

转为使用`libp2p`进行对等网络通讯， 使用`mDNS`协议自动发现链接节点。

### 0.0.3

更新了README.md， 更改为`github`的图片路径

### 0.0.2

更新了README.md， 更改为`gitee`的图片路径

### 0.0.1

初版发布

## 更多 More

本拓展开源。

详细内容和开发可查看掘金：

[赛博丁真Damon 的个人主页 - 动态 - 掘金](https://juejin.cn/user/4332493267283560)