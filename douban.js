// ==UserScript==
// @name         豆瓣阅读小工具 (聚力新生版)
// @name:zh-CN   豆瓣阅读小工具 (聚力新生版)
// @namespace    http://tampermonkey.net/
// @version      0.42
// @description  优化豆瓣网页版弹窗广告，自动展开手机原文，自动帮助回答薅羊毛的小组问题，修复默认豆瓣手机端无法查看小组问答
// @author       My Dream
// @match        https://www.douban.com/*
// @match        https://m.douban.com/*
// @icon         https://www.douban.com/favicon.ico
// @run-at       document-end
// @grant        GM_addStyle
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @connect      120.24.169.212
// @connect      greasyfork.org
// @license      AGPL License
// ==/UserScript==
//适配移动端回答窗口
//var styles = `.question-wrapper{background-color:#fafafa;border:1px solid #dfdfdf;line-height:1;margin:20px 0px;overflow:hidden;padding:25px 18px;white-space:normal;}form{margin:0;padding:0;border:0px;}.question-content{margin-top:25px;}.question-input,.question-posted{background-color:#f8f8f8;border:none;box-sizing:border-box;color:#404040;border-radius:5px;display:block;font-size:14px;margin-bottom:10px;padding:15px 20px;resize:none;width:100%;}.question-submit{margin:15px auto 10px;text-align:center;}.question-btn{background-color:#40a156;border:0;border-radius:3px;box-sizing:border-box;color:#fff;display:inline-block;font-size:17px;height:25px;line-height:25px;max-width:100%;min-width:80px;outline:none;}.question-tip{color:gray;font-size:12px;line-height:normal;margin-top:10px;}textarea:focus{outline:none !important;border:none !important;}.question-content{margin-top:25px;}.is-wrong .question-posted{background-color:rgba(223,16,16,.1);}.question-result-meta{margin-top:20px;display:flex;margin-bottom:8px;width:100%;}.question-result-stat.correct{text-align:left;}.question-result-stat.wrong{text-align:right;}.question-result-stat{color:gray;flex:1;font-size:15px;}.question-result-bar{background-color:rgba(0,0,0,.1);border-radius:5px;display:flex;height:10px;margin:18px 0;overflow:hidden;}.question-result-active.wrong{background-color:#c74444;}.question-result-answer{color:#1a1a1a;font-size:15px;margin-top:10px;}.question-meta{font-size:13px;margin:8px 0 10px;}`;
//var styleSheet = document.createElement("style")
//styleSheet.innerText = styles
//document.head.appendChild(styleSheet)


//以上测试浏览器兼容代码，实际使用可以删除
window.onload = function() {
    // 判断是否是小组文章
    const currentURL = window.location.href;
    const urlregex = /\/group\/topic\/(\d+)\//;
    if (!urlregex.test(currentURL)) {
        return;
    }
    //判断是否是对应小组
    const groupidpattern = /(656297|698716|700687|536786|712738|716166)/;
    if (typeof group !== 'undefined' && group.id) {
        var groupid = group.id;
    } else {
        groupid = $(".info a").attr("href").replace("/group/", "");
    }
    if (!groupidpattern.test(groupid)) {
        return;
    }
    //判断是否是薅羊毛作业
    const titlepattern = /(作业|科普|教程|车)/;
    if (typeof topic !== 'undefined' && topic.title) {
        var topictitle = topic.title;
        var topicid = topic.id;
    } else {
        topictitle = $("title").text();
        topicid = PARAM.target_id;
    }
    if (!titlepattern.test(topictitle)) {
        return;
    }
    var currentHostname = window.location.host;
    //移动端移除广告，展开原文，适配回答功能
    if (currentHostname == "m.douban.com") {
        console.log("手机端");
        // 自动展开移动端手机原文
        $('.openapp.block-btn').click();
        // 找到包含百度的 div 弹窗广告，并删除它们
        $('div iframe[src*="baidu.com"]').closest('div').remove();
        // 找到包含百度的 文章下面广告，并删除它们
        $('section div iframe[src*="baidu.com"]').closest('section').remove();
        // 再来一次
        $('div iframe[src*="baidu.com"]').closest('div').remove();
        //添加手机回复问答功能
        $(".question-title").after('<div class="question-content"><div class="question-meta"></div><form><textarea class="question-input" placeholder="请输入正确答案"></textarea><div class="question-submit"><button class="question-btn disabled">提交</button><div class="question-tip">提交后可查看结果</div></div></form></div>');
    }
    //自动回答
    $('div[data-entity-type="question"]').each(function() {
        let htmldata = this;
        let data = {
            Act: 'get',
            Cate: groupid,
            QID: $(this).attr('data-id'),
            Url: topicid
        };
        var postjson = JSON.stringify(data);
        $.http.post({
            url: "http://120.24.169.212:8899/",
            data: postjson
        }).then(response => {
            let jsonStr = response.responseText;
            let obj = JSON.parse(jsonStr);
            let objs = JSON.parse(obj.Content);
            let huifu = ["dd", "感谢姐妹", "哈哈", "谢谢", "xx", "你好", "大家好", "非常感谢", "啊哈哈", "随便说说", "好的哦", "没问题", "太棒了", "好喜欢", "无聊啊", "小tips", "有意思啊", "厉害了", "真不错", "好开心", "福利", "这样", "中", "指教", "真是个好问题", "顺风", "这个答案对吗？", "加油加油", "想什么", "好", "围观", "随便", "小幸福", "好神奇啊！", "努力！", "奖励", "真好", "喜欢", "笑死", "赞", "羡慕", "旅行", "哪里呀", "这个问题太难了吧", "你真厉害！", "好", "有", "美好", "点赞", "开开心心！", "出来", "学习", "分享", "好久不见", "珍贵", "假日", "愉快", "享受", "加油哦", "keep", "流星雨", "无聊透顶", "感谢", "好困", "请问", "健康的身体"];
            let randomIndex = Math.floor(Math.random() * huifu.length);
            let randomValue = huifu[randomIndex];
            if (obj.msg == "ok") {
                if (objs.mode == "wenda") {
                    if (currentHostname == "www.douban.com") {
                        $(htmldata).find(".question-content").addClass("is-wrong");
                        $(htmldata).find(".question-content").html('<form><div class="question-posted is-wrong">' + randomValue + '</div><div class="question-result-meta"><div class="question-result-stat correct"><span>答对</span><em>0人（0.0%）</em></div><div class="question-result-stat wrong"><span>你答错了</span><em>' + $(htmldata).find(".question-meta span").eq(0).text() + '人（100.0%）</em></div></div><div class="question-result-bar"><div class="question-result-active wrong" style="width: 100%;"></div></div><div class="question-result-answer">正确答案：' + objs.neirong + '</div></div></form>');
                    } else if (currentHostname == "m.douban.com") {
                        console.log("ok");
                        $(htmldata).find(".question-content").addClass("is-wrong");
                        $(htmldata).find(".question-content").html('<form><div class="question-posted is-wrong">' + randomValue + '</div><div class="question-result-meta"><div class="question-result-stat correct"><span>答对</span><em>0人（0.0%）</em></div><div class="question-result-stat wrong"><span>你答错了</span></div></div><div class="question-result-bar"><div class="question-result-active wrong" style="width: 100%;"></div></div><div class="question-result-answer">正确答案：' + objs.neirong + '</div></div></form>');
                    }
                }
            } else {
                if (objs.mode == "wenda") {
                    if (currentHostname === "www.douban.com") {
                        $(htmldata).find(".question-meta").html('<p><br><span>回答失败：' + objs.neirong + '</span><br></p>');
                    } else if (currentHostname == "m.douban.com") {
                        $(htmldata).find(".question-meta").html('<p><br><span>回答失败：' + objs.neirong + '</span><br></p>');
                    }
                }
            }
        });
    });
}

function ENV(){const e="function"==typeof require&&"undefined"!=typeof $jsbox;return{isQX:"undefined"!=typeof $task,isLoon:"undefined"!=typeof $loon,isSurge:"undefined"!=typeof $httpClient&&"undefined"!=typeof $utils,isBrowser:"undefined"!=typeof document,isNode:"function"==typeof require&&!e,isJSBox:e,isRequest:"undefined"!=typeof $request,isScriptable:"undefined"!=typeof importModule}}function HTTP(e={baseURL:""}){const{isQX:t,isLoon:s,isSurge:o,isScriptable:n,isNode:i,isBrowser:r}=ENV(),u=/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;const a={};return["GET","POST","PUT","DELETE","HEAD","OPTIONS","PATCH"].forEach(h=>a[h.toLowerCase()]=(a=>(function(a,h){h="string"==typeof h?{url:h}:h;const d=e.baseURL;d&&!u.test(h.url||"")&&(h.url=d?d+h.url:h.url),h.body&&h.headers&&!h.headers["Content-Type"]&&(h.headers["Content-Type"]="application/x-www-form-urlencoded");const l=(h={...e,...h}).timeout,c={onRequest:()=>{},onResponse:e=>e,onTimeout:()=>{},...h.events};let f,p;if(c.onRequest(a,h),t)f=$task.fetch({method:a,...h});else if(s||o||i)f=new Promise((e,t)=>{(i?require("request"):$httpClient)[a.toLowerCase()](h,(s,o,n)=>{s?t(s):e({statusCode:o.status||o.statusCode,headers:o.headers,body:n})})});else if(n){const e=new Request(h.url);e.method=a,e.headers=h.headers,e.body=h.body,f=new Promise((t,s)=>{e.loadString().then(s=>{t({statusCode:e.response.statusCode,headers:e.response.headers,body:s})}).catch(e=>s(e))})}else r&&(f=new Promise((e,t)=>{fetch(h.url,{method:a,headers:h.headers,body:h.body}).then(e=>e.json()).then(t=>e({statusCode:t.status,headers:t.headers,body:t.data})).catch(t)}));const y=l?new Promise((e,t)=>{p=setTimeout(()=>(c.onTimeout(),t(`${a} URL: ${h.url} exceeds the timeout ${l} ms`)),l)}):null;return(y?Promise.race([y,f]).then(e=>(clearTimeout(p),e)):f).then(e=>c.onResponse(e))})(h,a))),a}function API(e="untitled",t=!1){const{isQX:s,isLoon:o,isSurge:n,isNode:i,isJSBox:r,isScriptable:u}=ENV();return new class{constructor(e,t){this.name=e,this.debug=t,this.http=HTTP(),this.env=ENV(),this.node=(()=>{if(i){return{fs:require("fs")}}return null})(),this.initCache();Promise.prototype.delay=function(e){return this.then(function(t){return((e,t)=>new Promise(function(s){setTimeout(s.bind(null,t),e)}))(e,t)})}}initCache(){if(s&&(this.cache=JSON.parse($prefs.valueForKey(this.name)||"{}")),(o||n)&&(this.cache=JSON.parse($persistentStore.read(this.name)||"{}")),i){let e="root.json";this.node.fs.existsSync(e)||this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e)),this.root={},e=`${this.name}.json`,this.node.fs.existsSync(e)?this.cache=JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)):(this.node.fs.writeFileSync(e,JSON.stringify({}),{flag:"wx"},e=>console.log(e)),this.cache={})}}persistCache(){const e=JSON.stringify(this.cache,null,2);s&&$prefs.setValueForKey(e,this.name),(o||n)&&$persistentStore.write(e,this.name),i&&(this.node.fs.writeFileSync(`${this.name}.json`,e,{flag:"w"},e=>console.log(e)),this.node.fs.writeFileSync("root.json",JSON.stringify(this.root,null,2),{flag:"w"},e=>console.log(e)))}write(e,t){if(this.log(`SET ${t}`),-1!==t.indexOf("#")){if(t=t.substr(1),n||o)return $persistentStore.write(e,t);if(s)return $prefs.setValueForKey(e,t);i&&(this.root[t]=e)}else this.cache[t]=e;this.persistCache()}read(e){return this.log(`READ ${e}`),-1===e.indexOf("#")?this.cache[e]:(e=e.substr(1),n||o?$persistentStore.read(e):s?$prefs.valueForKey(e):i?this.root[e]:void 0)}delete(e){if(this.log(`DELETE ${e}`),-1!==e.indexOf("#")){if(e=e.substr(1),n||o)return $persistentStore.write(null,e);if(s)return $prefs.removeValueForKey(e);i&&delete this.root[e]}else delete this.cache[e];this.persistCache()}notify(e,t="",a="",h={}){const d=h["open-url"],l=h["media-url"];if(s&&$notify(e,t,a,h),n&&$notification.post(e,t,a+`${l?"\n多媒体:"+l:""}`,{url:d}),o){let s={};d&&(s.openUrl=d),l&&(s.mediaUrl=l),"{}"===JSON.stringify(s)?$notification.post(e,t,a):$notification.post(e,t,a,s)}if(i||u){const s=a+(d?`\n点击跳转: ${d}`:"")+(l?`\n多媒体: ${l}`:"");if(r){require("push").schedule({title:e,body:(t?t+"\n":"")+s})}else console.log(`${e}\n${t}\n${s}\n\n`)}}log(e){this.debug&&console.log(`[${this.name}] LOG: ${this.stringify(e)}`)}info(e){console.log(`[${this.name}] INFO: ${this.stringify(e)}`)}error(e){console.log(`[${this.name}] ERROR: ${this.stringify(e)}`)}wait(e){return new Promise(t=>setTimeout(t,e))}done(e={}){s||o||n?$done(e):i&&!r&&"undefined"!=typeof $context&&($context.headers=e.headers,$context.statusCode=e.statusCode,$context.body=e.body)}stringify(e){if("string"==typeof e||e instanceof String)return e;try{return JSON.stringify(e,null,2)}catch(e){return"[object Object]"}}}(e,t)}