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
var styles = `.question-wrapper{background-color:#fafafa;border:1px solid #dfdfdf;line-height:1;margin:20px 0px;overflow:hidden;padding:25px 18px;white-space:normal;}form{margin:0;padding:0;border:0px;}.question-content{margin-top:25px;}.question-input,.question-posted{background-color:#f8f8f8;border:none;box-sizing:border-box;color:#404040;border-radius:5px;display:block;font-size:14px;margin-bottom:10px;padding:15px 20px;resize:none;width:100%;}.question-submit{margin:15px auto 10px;text-align:center;}.question-btn{background-color:#40a156;border:0;border-radius:3px;box-sizing:border-box;color:#fff;display:inline-block;font-size:17px;height:25px;line-height:25px;max-width:100%;min-width:80px;outline:none;}.question-tip{color:gray;font-size:12px;line-height:normal;margin-top:10px;}textarea:focus{outline:none !important;border:none !important;}.question-content{margin-top:25px;}.is-wrong .question-posted{background-color:rgba(223,16,16,.1);}.question-result-meta{margin-top:20px;display:flex;margin-bottom:8px;width:100%;}.question-result-stat.correct{text-align:left;}.question-result-stat.wrong{text-align:right;}.question-result-stat{color:gray;flex:1;font-size:15px;}.question-result-bar{background-color:rgba(0,0,0,.1);border-radius:5px;display:flex;height:10px;margin:18px 0;overflow:hidden;}.question-result-active.wrong{background-color:#c74444;}.question-result-answer{color:#1a1a1a;font-size:15px;margin-top:10px;}.question-meta{font-size:13px;margin:8px 0 10px;}`;
var styleSheet = document.createElement("style")
styleSheet.innerText = styles
document.head.appendChild(styleSheet)


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
        $.post({
            url: "http://120.24.169.212:8899/",
            data: postjson
        }, async (err, resp, data) => {
        try {
            let jsonStr = resp.responseText;
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
        } catch (e) {
          $.logErr(e, resp);
        }
      })
    });
}

function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,g=-8){ let f=new Date().getTimezoneOffset();let d=new Date().getTime()+ f * 60 * 1000 - (g * 60 * 60 * 1000); let n = new Date(d);let e={"M+":n.getMonth()+1,"d+":n.getDate(),"H+":n.getHours(),"m+":n.getMinutes(),"s+":n.getSeconds(),"q+":Math.floor((n.getMonth()+3)/3),S:n.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(n.getFullYear()+"").substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r)));let h=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}