(function(){var u=Object.defineProperty;var p=(a,e,t)=>e in a?u(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var r=(a,e,t)=>p(a,typeof e!="symbol"?e+"":e,t);class g{constructor(){r(this,"shadowHost",null);r(this,"shadowRoot",null);r(this,"requests",[]);r(this,"isVisible",!1)}show(){this.isVisible||(this.createShadowHost(),this.attachShadowDOM(),this.injectStyles(),this.renderUI(),this.isVisible=!0)}hide(){!this.isVisible||!this.shadowHost||(this.shadowHost.remove(),this.shadowHost=null,this.shadowRoot=null,this.isVisible=!1)}addRequest(e){this.requests.unshift(e),this.requests.length>1e3&&(this.requests=this.requests.slice(0,1e3)),this.isVisible&&this.updateRequestList()}clearRequests(){this.requests=[],this.isVisible&&this.updateRequestList()}getRequests(){return[...this.requests]}createShadowHost(){this.shadowHost=document.createElement("div"),this.shadowHost.id="xhr-inspector-overlay",this.shadowHost.style.cssText=`
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui;
      pointer-events: auto;
    `,document.body.appendChild(this.shadowHost)}attachShadowDOM(){if(!this.shadowHost)return;this.shadowRoot=this.shadowHost.attachShadow({mode:"closed"});const e=document.createElement("div");e.id="overlay-container",this.shadowRoot.appendChild(e)}injectStyles(){if(!this.shadowRoot)return;const e=document.createElement("style");e.textContent=`
      :host { all: initial; display: block; }
      #overlay-container {
        width: 400px; height: 600px; background: white;
        border: 1px solid #e5e7eb; border-radius: 8px;
        box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
        overflow: hidden; display: flex; flex-direction: column;
        font-size: 14px; line-height: 1.5;
      }
      .overlay-header {
        padding: 12px 16px; background: #f9fafb;
        border-bottom: 1px solid #e5e7eb; display: flex;
        align-items: center; justify-content: space-between;
      }
      .overlay-title { font-weight: 600; color: #374151; margin: 0; font-size: 14px; }
      .overlay-content { flex: 1; overflow: auto; padding: 0; }
      .request-item {
        padding: 12px 16px; border-bottom: 1px solid #f3f4f6;
        cursor: pointer; transition: background-color 0.15s;
      }
      .request-item:hover { background: #f9fafb; }
      .request-method {
        display: inline-block; padding: 2px 6px; border-radius: 4px;
        font-size: 11px; font-weight: 600; margin-right: 8px;
        min-width: 45px; text-align: center;
      }
      .method-get { background: #dbeafe; color: #1e40af; }
      .method-post { background: #dcfce7; color: #166534; }
      .method-put { background: #fef3c7; color: #92400e; }
      .method-delete { background: #fee2e2; color: #dc2626; }
      .request-url { color: #374151; font-size: 13px; word-break: break-all; }
      .request-status { font-size: 12px; color: #6b7280; margin-top: 4px; }
      .status-2xx { color: #16a34a; }
      .status-3xx { color: #eab308; }
      .status-4xx { color: #dc2626; }
      .status-5xx { color: #dc2626; }
      .close-button {
        background: none; border: none; font-size: 18px;
        color: #6b7280; cursor: pointer; padding: 4px; line-height: 1;
      }
      .close-button:hover { color: #374151; }
      .empty-state { padding: 40px 20px; text-align: center; color: #6b7280; }
    `,this.shadowRoot.appendChild(e)}renderUI(){if(!this.shadowRoot)return;const e=this.shadowRoot.getElementById("overlay-container");e&&(e.innerHTML=`
      <div class="overlay-header">
        <h3 class="overlay-title">XHR Inspector</h3>
        <button class="close-button" onclick="this.getRootNode().host.style.display='none'">×</button>
      </div>
      <div class="overlay-content" id="request-list">
        <div class="empty-state">
          Monitoring network requests...<br>
          Make some AJAX calls to see them here.
        </div>
      </div>
    `,this.updateRequestList())}updateRequestList(){if(!this.shadowRoot)return;const e=this.shadowRoot.getElementById("request-list");if(e){if(this.requests.length===0){e.innerHTML=`
        <div class="empty-state">
          Monitoring network requests...<br>
          Make some AJAX calls to see them here.
        </div>
      `;return}e.innerHTML=this.requests.map(t=>`
      <div class="request-item" data-request-id="${t.id}">
        <div>
          <span class="request-method method-${t.method.toLowerCase()}">${t.method}</span>
          <span class="request-url">${this.truncateUrl(t.url)}</span>
        </div>
        <div class="request-status status-${Math.floor(t.status/100)}xx">
          ${t.status} ${t.statusText} • ${t.responseTime}ms • ${this.formatSize(t.responseSize)}
        </div>
      </div>
    `).join("")}}truncateUrl(e){return e.length<=50?e:e.substring(0,47)+"..."}formatSize(e){if(e===0)return"0 B";const t=1024,s=["B","KB","MB","GB"],o=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,o)).toFixed(1))+" "+s[o]}}class y{constructor(){r(this,"originalFetch");r(this,"originalXHROpen");r(this,"originalXHRSend");r(this,"onRequestCallback",null);this.originalFetch=window.fetch.bind(window),this.originalXHROpen=XMLHttpRequest.prototype.open,this.originalXHRSend=XMLHttpRequest.prototype.send}start(e){this.onRequestCallback=e,this.interceptFetch(),this.interceptXHR()}stop(){this.onRequestCallback=null,this.restoreFetch(),this.restoreXHR()}interceptFetch(){window.fetch=async(e,t)=>{const s=performance.now(),o=typeof e=="string"?e:e instanceof URL?e.href:e.url,d=t?.method||"GET";try{const i=await this.originalFetch(e,t),n=performance.now(),l=i.clone(),h=await this.getResponseBody(l),c={id:crypto.randomUUID(),timestamp:Date.now(),method:d,url:o,status:i.status,statusText:i.statusText,requestHeaders:this.getRequestHeaders(t?.headers),responseHeaders:this.getResponseHeaders(i.headers),requestBody:t?.body,responseBody:h,responseTime:Math.round(n-s),responseSize:h?new Blob([h]).size:0,requestSize:t?.body?new Blob([t.body]).size:0,mimeType:i.headers.get("content-type")||"text/plain",initiator:{type:"fetch"},timing:{requestStart:s,responseStart:n-1,responseEnd:n,totalTime:n-s}};return this.onRequestCallback?.(c),i}catch(i){const n=performance.now(),l={id:crypto.randomUUID(),timestamp:Date.now(),method:d,url:o,status:0,statusText:"Network Error",requestHeaders:this.getRequestHeaders(t?.headers),responseHeaders:{},requestBody:t?.body,responseTime:Math.round(n-s),responseSize:0,requestSize:t?.body?new Blob([t.body]).size:0,mimeType:"text/plain",initiator:{type:"fetch"},timing:{requestStart:s,responseStart:0,responseEnd:n,totalTime:n-s},error:{message:i.message,type:"NetworkError"}};throw this.onRequestCallback?.(l),i}}}interceptXHR(){const e=this;XMLHttpRequest.prototype.open=function(t,s,o){return this._xhr_inspector={method:t,url:typeof s=="string"?s:s.href,startTime:0,requestHeaders:{}},e.originalXHROpen.call(this,t,s,o)},XMLHttpRequest.prototype.send=function(t){const s=this._xhr_inspector;return s?(s.startTime=performance.now(),s.requestBody=t,this.addEventListener("loadend",()=>{const o=performance.now(),d={id:crypto.randomUUID(),timestamp:Date.now(),method:s.method,url:s.url,status:this.status,statusText:this.statusText,requestHeaders:s.requestHeaders,responseHeaders:e.parseResponseHeaders(this.getAllResponseHeaders()),requestBody:s.requestBody,responseBody:this.responseText,responseTime:Math.round(o-s.startTime),responseSize:this.responseText?new Blob([this.responseText]).size:0,requestSize:s.requestBody?new Blob([s.requestBody]).size:0,mimeType:this.getResponseHeader("content-type")||"text/plain",initiator:{type:"xhr"},timing:{requestStart:s.startTime,responseStart:o-1,responseEnd:o,totalTime:o-s.startTime}};this.status===0&&this.statusText===""&&(d.error={message:"Network request failed",type:"NetworkError"}),e.onRequestCallback?.(d)}),e.originalXHRSend.call(this,t)):e.originalXHRSend.call(this,t)}}async getResponseBody(e){try{const t=e.headers.get("content-type")||"";return t.includes("application/json")?JSON.stringify(await e.json()):t.includes("text/")?await e.text():"[Binary Data]"}catch{return"[Could not read response]"}}getRequestHeaders(e){const t={};return e&&(e instanceof Headers?e.forEach((s,o)=>{t[o]=s}):Array.isArray(e)?e.forEach(([s,o])=>{t[s]=o}):Object.assign(t,e)),t}getResponseHeaders(e){const t={};return e.forEach((s,o)=>{t[o]=s}),t}parseResponseHeaders(e){const t={};return e.split(`\r
`).forEach(s=>{const o=s.indexOf(":");if(o>0){const d=s.substring(0,o).trim(),i=s.substring(o+1).trim();t[d]=i}}),t}restoreFetch(){window.fetch=this.originalFetch}restoreXHR(){XMLHttpRequest.prototype.open=this.originalXHROpen,XMLHttpRequest.prototype.send=this.originalXHRSend}}class m{constructor(){r(this,"overlayManager");r(this,"networkInterceptor");r(this,"isEnabled",!1);this.overlayManager=new g,this.networkInterceptor=new y,this.setupMessageListener(),this.initializeOnLoad()}setupMessageListener(){chrome.runtime.onMessage.addListener((e,t,s)=>(this.handleMessage(e,t,s),!0))}async initializeOnLoad(){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>this.initialize()):await this.initialize()}async initialize(){const{settings:e}=await chrome.storage.local.get("settings");this.networkInterceptor.start(t=>{this.overlayManager.addRequest(t)}),e?.autoShow&&this.enableOverlay()}async handleMessage(e,t,s){switch(e.type){case"TOGGLE_OVERLAY":this.toggleOverlay(),s({success:!0});break;case"NETWORK_REQUEST":e.data&&this.overlayManager.addRequest(e.data),s({success:!0});break;case"CLEAR_REQUESTS":this.overlayManager.clearRequests(),s({success:!0});break;default:s({error:"Unknown message type"})}}toggleOverlay(){this.isEnabled?this.disableOverlay():this.enableOverlay()}enableOverlay(){this.isEnabled=!0,this.overlayManager.show()}disableOverlay(){this.isEnabled=!1,this.overlayManager.hide()}}new m;
})()
