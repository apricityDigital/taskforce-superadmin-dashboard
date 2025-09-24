"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[97],{1853:function(e,t,n){n.d(t,{Z:function(){return s}});var o=n(4297);let s=(0,o.Z)("AlertTriangle",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",key:"c3ski4"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]])},3756:function(e,t,n){n.d(t,{Z:function(){return s}});var o=n(4297);let s=(0,o.Z)("CheckCircle",[["path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14",key:"g774vq"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]])},5077:function(e,t,n){n.d(t,{Z:function(){return s}});var o=n(4297);let s=(0,o.Z)("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]])},3025:function(e,t,n){n.d(t,{Z:function(){return s}});var o=n(4297);let s=(0,o.Z)("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]])},4464:function(e,t,n){n.d(t,{Z:function(){return s}});var o=n(4297);let s=(0,o.Z)("Eye",[["path",{d:"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z",key:"rwhkz3"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]])},5162:function(e,t,n){n.d(t,{Z:function(){return s}});var o=n(4297);let s=(0,o.Z)("Sparkles",[["path",{d:"m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z",key:"17u4zn"}],["path",{d:"M5 3v4",key:"bklmnn"}],["path",{d:"M19 17v4",key:"iiml17"}],["path",{d:"M3 5h4",key:"nem4j1"}],["path",{d:"M17 19h4",key:"lbex7p"}]])},1341:function(e,t,n){var o,s,r,i,a,l,c,d,u,h,f,g,E,p,m,C,I,v,y,R,_,O,A,T;n.d(t,{$D:function(){return GoogleGenerativeAI}}),(E=o||(o={})).STRING="string",E.NUMBER="number",E.INTEGER="integer",E.BOOLEAN="boolean",E.ARRAY="array",E.OBJECT="object",(p=s||(s={})).LANGUAGE_UNSPECIFIED="language_unspecified",p.PYTHON="python",(m=r||(r={})).OUTCOME_UNSPECIFIED="outcome_unspecified",m.OUTCOME_OK="outcome_ok",m.OUTCOME_FAILED="outcome_failed",m.OUTCOME_DEADLINE_EXCEEDED="outcome_deadline_exceeded";/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let G=["user","model","function","system"];(C=i||(i={})).HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",C.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",C.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",C.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",C.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT",C.HARM_CATEGORY_CIVIC_INTEGRITY="HARM_CATEGORY_CIVIC_INTEGRITY",(I=a||(a={})).HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",I.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",I.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",I.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",I.BLOCK_NONE="BLOCK_NONE",(v=l||(l={})).HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",v.NEGLIGIBLE="NEGLIGIBLE",v.LOW="LOW",v.MEDIUM="MEDIUM",v.HIGH="HIGH",(y=c||(c={})).BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",y.SAFETY="SAFETY",y.OTHER="OTHER",(R=d||(d={})).FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",R.STOP="STOP",R.MAX_TOKENS="MAX_TOKENS",R.SAFETY="SAFETY",R.RECITATION="RECITATION",R.LANGUAGE="LANGUAGE",R.BLOCKLIST="BLOCKLIST",R.PROHIBITED_CONTENT="PROHIBITED_CONTENT",R.SPII="SPII",R.MALFORMED_FUNCTION_CALL="MALFORMED_FUNCTION_CALL",R.OTHER="OTHER",(_=u||(u={})).TASK_TYPE_UNSPECIFIED="TASK_TYPE_UNSPECIFIED",_.RETRIEVAL_QUERY="RETRIEVAL_QUERY",_.RETRIEVAL_DOCUMENT="RETRIEVAL_DOCUMENT",_.SEMANTIC_SIMILARITY="SEMANTIC_SIMILARITY",_.CLASSIFICATION="CLASSIFICATION",_.CLUSTERING="CLUSTERING",(O=h||(h={})).MODE_UNSPECIFIED="MODE_UNSPECIFIED",O.AUTO="AUTO",O.ANY="ANY",O.NONE="NONE",(A=f||(f={})).MODE_UNSPECIFIED="MODE_UNSPECIFIED",A.MODE_DYNAMIC="MODE_DYNAMIC";/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let GoogleGenerativeAIError=class GoogleGenerativeAIError extends Error{constructor(e){super(`[GoogleGenerativeAI Error]: ${e}`)}};let GoogleGenerativeAIResponseError=class GoogleGenerativeAIResponseError extends GoogleGenerativeAIError{constructor(e,t){super(e),this.response=t}};let GoogleGenerativeAIFetchError=class GoogleGenerativeAIFetchError extends GoogleGenerativeAIError{constructor(e,t,n,o){super(e),this.status=t,this.statusText=n,this.errorDetails=o}};let GoogleGenerativeAIRequestInputError=class GoogleGenerativeAIRequestInputError extends GoogleGenerativeAIError{};let GoogleGenerativeAIAbortError=class GoogleGenerativeAIAbortError extends GoogleGenerativeAIError{};(T=g||(g={})).GENERATE_CONTENT="generateContent",T.STREAM_GENERATE_CONTENT="streamGenerateContent",T.COUNT_TOKENS="countTokens",T.EMBED_CONTENT="embedContent",T.BATCH_EMBED_CONTENTS="batchEmbedContents";let RequestUrl=class RequestUrl{constructor(e,t,n,o,s){this.model=e,this.task=t,this.apiKey=n,this.stream=o,this.requestOptions=s}toString(){var e,t;let n=(null===(e=this.requestOptions)||void 0===e?void 0:e.apiVersion)||"v1beta",o=(null===(t=this.requestOptions)||void 0===t?void 0:t.baseUrl)||"https://generativelanguage.googleapis.com",s=`${o}/${n}/${this.model}:${this.task}`;return this.stream&&(s+="?alt=sse"),s}};function getClientHeaders(e){let t=[];return(null==e?void 0:e.apiClient)&&t.push(e.apiClient),t.push("genai-js/0.24.1"),t.join(" ")}async function getHeaders(e){var t;let n=new Headers;n.append("Content-Type","application/json"),n.append("x-goog-api-client",getClientHeaders(e.requestOptions)),n.append("x-goog-api-key",e.apiKey);let o=null===(t=e.requestOptions)||void 0===t?void 0:t.customHeaders;if(o){if(!(o instanceof Headers))try{o=new Headers(o)}catch(e){throw new GoogleGenerativeAIRequestInputError(`unable to convert customHeaders value ${JSON.stringify(o)} to Headers: ${e.message}`)}for(let[e,t]of o.entries()){if("x-goog-api-key"===e)throw new GoogleGenerativeAIRequestInputError(`Cannot set reserved header name ${e}`);if("x-goog-api-client"===e)throw new GoogleGenerativeAIRequestInputError(`Header name ${e} can only be set using the apiClient field`);n.append(e,t)}}return n}async function constructModelRequest(e,t,n,o,s,r){let i=new RequestUrl(e,t,n,o,r);return{url:i.toString(),fetchOptions:Object.assign(Object.assign({},buildFetchOptions(r)),{method:"POST",headers:await getHeaders(i),body:s})}}async function makeModelRequest(e,t,n,o,s,r={},i=fetch){let{url:a,fetchOptions:l}=await constructModelRequest(e,t,n,o,s,r);return makeRequest(a,l,i)}async function makeRequest(e,t,n=fetch){let o;try{o=await n(e,t)}catch(t){handleResponseError(t,e)}return o.ok||await handleResponseNotOk(o,e),o}function handleResponseError(e,t){let n=e;throw"AbortError"===n.name?(n=new GoogleGenerativeAIAbortError(`Request aborted when fetching ${t.toString()}: ${e.message}`)).stack=e.stack:e instanceof GoogleGenerativeAIFetchError||e instanceof GoogleGenerativeAIRequestInputError||((n=new GoogleGenerativeAIError(`Error fetching from ${t.toString()}: ${e.message}`)).stack=e.stack),n}async function handleResponseNotOk(e,t){let n,o="";try{let t=await e.json();o=t.error.message,t.error.details&&(o+=` ${JSON.stringify(t.error.details)}`,n=t.error.details)}catch(e){}throw new GoogleGenerativeAIFetchError(`Error fetching from ${t.toString()}: [${e.status} ${e.statusText}] ${o}`,e.status,e.statusText,n)}function buildFetchOptions(e){let t={};if((null==e?void 0:e.signal)!==void 0||(null==e?void 0:e.timeout)>=0){let n=new AbortController;(null==e?void 0:e.timeout)>=0&&setTimeout(()=>n.abort(),e.timeout),(null==e?void 0:e.signal)&&e.signal.addEventListener("abort",()=>{n.abort()}),t.signal=n.signal}return t}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function addHelpers(e){return e.text=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`),hadBadFinishReason(e.candidates[0]))throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(e)}`,e);return getText(e)}if(e.promptFeedback)throw new GoogleGenerativeAIResponseError(`Text not available. ${formatBlockErrorMessage(e)}`,e);return""},e.functionCall=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),hadBadFinishReason(e.candidates[0]))throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(e)}`,e);return console.warn("response.functionCall() is deprecated. Use response.functionCalls() instead."),getFunctionCalls(e)[0]}if(e.promptFeedback)throw new GoogleGenerativeAIResponseError(`Function call not available. ${formatBlockErrorMessage(e)}`,e)},e.functionCalls=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),hadBadFinishReason(e.candidates[0]))throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(e)}`,e);return getFunctionCalls(e)}if(e.promptFeedback)throw new GoogleGenerativeAIResponseError(`Function call not available. ${formatBlockErrorMessage(e)}`,e)},e}function getText(e){var t,n,o,s;let r=[];if(null===(n=null===(t=e.candidates)||void 0===t?void 0:t[0].content)||void 0===n?void 0:n.parts)for(let t of null===(s=null===(o=e.candidates)||void 0===o?void 0:o[0].content)||void 0===s?void 0:s.parts)t.text&&r.push(t.text),t.executableCode&&r.push("\n```"+t.executableCode.language+"\n"+t.executableCode.code+"\n```\n"),t.codeExecutionResult&&r.push("\n```\n"+t.codeExecutionResult.output+"\n```\n");return r.length>0?r.join(""):""}function getFunctionCalls(e){var t,n,o,s;let r=[];if(null===(n=null===(t=e.candidates)||void 0===t?void 0:t[0].content)||void 0===n?void 0:n.parts)for(let t of null===(s=null===(o=e.candidates)||void 0===o?void 0:o[0].content)||void 0===s?void 0:s.parts)t.functionCall&&r.push(t.functionCall);return r.length>0?r:void 0}let N=[d.RECITATION,d.SAFETY,d.LANGUAGE];function hadBadFinishReason(e){return!!e.finishReason&&N.includes(e.finishReason)}function formatBlockErrorMessage(e){var t,n,o;let s="";if((!e.candidates||0===e.candidates.length)&&e.promptFeedback)s+="Response was blocked",(null===(t=e.promptFeedback)||void 0===t?void 0:t.blockReason)&&(s+=` due to ${e.promptFeedback.blockReason}`),(null===(n=e.promptFeedback)||void 0===n?void 0:n.blockReasonMessage)&&(s+=`: ${e.promptFeedback.blockReasonMessage}`);else if(null===(o=e.candidates)||void 0===o?void 0:o[0]){let t=e.candidates[0];hadBadFinishReason(t)&&(s+=`Candidate was blocked due to ${t.finishReason}`,t.finishMessage&&(s+=`: ${t.finishMessage}`))}return s}function __await(e){return this instanceof __await?(this.v=e,this):new __await(e)}function __asyncGenerator(e,t,n){if(!Symbol.asyncIterator)throw TypeError("Symbol.asyncIterator is not defined.");var o,s=n.apply(e,t||[]),r=[];return o={},verb("next"),verb("throw"),verb("return"),o[Symbol.asyncIterator]=function(){return this},o;function verb(e){s[e]&&(o[e]=function(t){return new Promise(function(n,o){r.push([e,t,n,o])>1||resume(e,t)})})}function resume(e,t){try{step(s[e](t))}catch(e){settle(r[0][3],e)}}function step(e){e.value instanceof __await?Promise.resolve(e.value.v).then(fulfill,reject):settle(r[0][2],e)}function fulfill(e){resume("next",e)}function reject(e){resume("throw",e)}function settle(e,t){e(t),r.shift(),r.length&&resume(r[0][0],r[0][1])}}"function"==typeof SuppressedError&&SuppressedError;/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let S=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;function processStream(e){let t=e.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0})),n=getResponseStream(t),[o,s]=n.tee();return{stream:generateResponseSequence(o),response:getResponsePromise(s)}}async function getResponsePromise(e){let t=[],n=e.getReader();for(;;){let{done:e,value:o}=await n.read();if(e)return addHelpers(aggregateResponses(t));t.push(o)}}function generateResponseSequence(e){return __asyncGenerator(this,arguments,function*(){let t=e.getReader();for(;;){let{value:e,done:n}=yield __await(t.read());if(n)break;yield yield __await(addHelpers(e))}})}function getResponseStream(e){let t=e.getReader(),n=new ReadableStream({start(e){let n="";return pump();function pump(){return t.read().then(({value:t,done:o})=>{let s;if(o){if(n.trim()){e.error(new GoogleGenerativeAIError("Failed to parse stream"));return}e.close();return}let r=(n+=t).match(S);for(;r;){try{s=JSON.parse(r[1])}catch(t){e.error(new GoogleGenerativeAIError(`Error parsing JSON response: "${r[1]}"`));return}e.enqueue(s),r=(n=n.substring(r[0].length)).match(S)}return pump()}).catch(e=>{let t=e;throw t.stack=e.stack,t="AbortError"===t.name?new GoogleGenerativeAIAbortError("Request aborted when reading from the stream"):new GoogleGenerativeAIError("Error reading from the stream")})}}});return n}function aggregateResponses(e){let t=e[e.length-1],n={promptFeedback:null==t?void 0:t.promptFeedback};for(let t of e){if(t.candidates){let e=0;for(let o of t.candidates)if(n.candidates||(n.candidates=[]),n.candidates[e]||(n.candidates[e]={index:e}),n.candidates[e].citationMetadata=o.citationMetadata,n.candidates[e].groundingMetadata=o.groundingMetadata,n.candidates[e].finishReason=o.finishReason,n.candidates[e].finishMessage=o.finishMessage,n.candidates[e].safetyRatings=o.safetyRatings,o.content&&o.content.parts){n.candidates[e].content||(n.candidates[e].content={role:o.content.role||"user",parts:[]});let t={};for(let s of o.content.parts)s.text&&(t.text=s.text),s.functionCall&&(t.functionCall=s.functionCall),s.executableCode&&(t.executableCode=s.executableCode),s.codeExecutionResult&&(t.codeExecutionResult=s.codeExecutionResult),0===Object.keys(t).length&&(t.text=""),n.candidates[e].content.parts.push(t)}e++}t.usageMetadata&&(n.usageMetadata=t.usageMetadata)}return n}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function generateContentStream(e,t,n,o){let s=await makeModelRequest(t,g.STREAM_GENERATE_CONTENT,e,!0,JSON.stringify(n),o);return processStream(s)}async function generateContent(e,t,n,o){let s=await makeModelRequest(t,g.GENERATE_CONTENT,e,!1,JSON.stringify(n),o),r=await s.json(),i=addHelpers(r);return{response:i}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function formatSystemInstruction(e){if(null!=e){if("string"==typeof e)return{role:"system",parts:[{text:e}]};if(e.text)return{role:"system",parts:[e]};if(e.parts)return e.role?e:{role:"system",parts:e.parts}}}function formatNewContent(e){let t=[];if("string"==typeof e)t=[{text:e}];else for(let n of e)"string"==typeof n?t.push({text:n}):t.push(n);return assignRoleToPartsAndValidateSendMessageRequest(t)}function assignRoleToPartsAndValidateSendMessageRequest(e){let t={role:"user",parts:[]},n={role:"function",parts:[]},o=!1,s=!1;for(let r of e)"functionResponse"in r?(n.parts.push(r),s=!0):(t.parts.push(r),o=!0);if(o&&s)throw new GoogleGenerativeAIError("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");if(!o&&!s)throw new GoogleGenerativeAIError("No content is provided for sending chat message.");return o?t:n}function formatCountTokensInput(e,t){var n;let o={model:null==t?void 0:t.model,generationConfig:null==t?void 0:t.generationConfig,safetySettings:null==t?void 0:t.safetySettings,tools:null==t?void 0:t.tools,toolConfig:null==t?void 0:t.toolConfig,systemInstruction:null==t?void 0:t.systemInstruction,cachedContent:null===(n=null==t?void 0:t.cachedContent)||void 0===n?void 0:n.name,contents:[]},s=null!=e.generateContentRequest;if(e.contents){if(s)throw new GoogleGenerativeAIRequestInputError("CountTokensRequest must have one of contents or generateContentRequest, not both.");o.contents=e.contents}else if(s)o=Object.assign(Object.assign({},o),e.generateContentRequest);else{let t=formatNewContent(e);o.contents=[t]}return{generateContentRequest:o}}function formatGenerateContentInput(e){let t;if(e.contents)t=e;else{let n=formatNewContent(e);t={contents:[n]}}return e.systemInstruction&&(t.systemInstruction=formatSystemInstruction(e.systemInstruction)),t}function formatEmbedContentInput(e){if("string"==typeof e||Array.isArray(e)){let t=formatNewContent(e);return{content:t}}return e}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let w=["text","inlineData","functionCall","functionResponse","executableCode","codeExecutionResult"],b={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall","executableCode","codeExecutionResult"],system:["text"]};function validateChatHistory(e){let t=!1;for(let n of e){let{role:e,parts:o}=n;if(!t&&"user"!==e)throw new GoogleGenerativeAIError(`First content should be with role 'user', got ${e}`);if(!G.includes(e))throw new GoogleGenerativeAIError(`Each item should include role field. Got ${e} but valid roles are: ${JSON.stringify(G)}`);if(!Array.isArray(o))throw new GoogleGenerativeAIError("Content should have 'parts' property with an array of Parts");if(0===o.length)throw new GoogleGenerativeAIError("Each Content should have at least one part");let s={text:0,inlineData:0,functionCall:0,functionResponse:0,fileData:0,executableCode:0,codeExecutionResult:0};for(let e of o)for(let t of w)t in e&&(s[t]+=1);let r=b[e];for(let t of w)if(!r.includes(t)&&s[t]>0)throw new GoogleGenerativeAIError(`Content with role '${e}' can't contain '${t}' part`);t=!0}}function isValidResponse(e){var t;if(void 0===e.candidates||0===e.candidates.length)return!1;let n=null===(t=e.candidates[0])||void 0===t?void 0:t.content;if(void 0===n||void 0===n.parts||0===n.parts.length)return!1;for(let e of n.parts)if(void 0===e||0===Object.keys(e).length||void 0!==e.text&&""===e.text)return!1;return!0}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let M="SILENT_ERROR";let ChatSession=class ChatSession{constructor(e,t,n,o={}){this.model=t,this.params=n,this._requestOptions=o,this._history=[],this._sendPromise=Promise.resolve(),this._apiKey=e,(null==n?void 0:n.history)&&(validateChatHistory(n.history),this._history=n.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(e,t={}){var n,o,s,r,i,a;let l;await this._sendPromise;let c=formatNewContent(e),d={safetySettings:null===(n=this.params)||void 0===n?void 0:n.safetySettings,generationConfig:null===(o=this.params)||void 0===o?void 0:o.generationConfig,tools:null===(s=this.params)||void 0===s?void 0:s.tools,toolConfig:null===(r=this.params)||void 0===r?void 0:r.toolConfig,systemInstruction:null===(i=this.params)||void 0===i?void 0:i.systemInstruction,cachedContent:null===(a=this.params)||void 0===a?void 0:a.cachedContent,contents:[...this._history,c]},u=Object.assign(Object.assign({},this._requestOptions),t);return this._sendPromise=this._sendPromise.then(()=>generateContent(this._apiKey,this.model,d,u)).then(e=>{var t;if(isValidResponse(e.response)){this._history.push(c);let n=Object.assign({parts:[],role:"model"},null===(t=e.response.candidates)||void 0===t?void 0:t[0].content);this._history.push(n)}else{let t=formatBlockErrorMessage(e.response);t&&console.warn(`sendMessage() was unsuccessful. ${t}. Inspect response object for details.`)}l=e}).catch(e=>{throw this._sendPromise=Promise.resolve(),e}),await this._sendPromise,l}async sendMessageStream(e,t={}){var n,o,s,r,i,a;await this._sendPromise;let l=formatNewContent(e),c={safetySettings:null===(n=this.params)||void 0===n?void 0:n.safetySettings,generationConfig:null===(o=this.params)||void 0===o?void 0:o.generationConfig,tools:null===(s=this.params)||void 0===s?void 0:s.tools,toolConfig:null===(r=this.params)||void 0===r?void 0:r.toolConfig,systemInstruction:null===(i=this.params)||void 0===i?void 0:i.systemInstruction,cachedContent:null===(a=this.params)||void 0===a?void 0:a.cachedContent,contents:[...this._history,l]},d=Object.assign(Object.assign({},this._requestOptions),t),u=generateContentStream(this._apiKey,this.model,c,d);return this._sendPromise=this._sendPromise.then(()=>u).catch(e=>{throw Error(M)}).then(e=>e.response).then(e=>{if(isValidResponse(e)){this._history.push(l);let t=Object.assign({},e.candidates[0].content);t.role||(t.role="model"),this._history.push(t)}else{let t=formatBlockErrorMessage(e);t&&console.warn(`sendMessageStream() was unsuccessful. ${t}. Inspect response object for details.`)}}).catch(e=>{e.message!==M&&console.error(e)}),u}};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function countTokens(e,t,n,o){let s=await makeModelRequest(t,g.COUNT_TOKENS,e,!1,JSON.stringify(n),o);return s.json()}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function embedContent(e,t,n,o){let s=await makeModelRequest(t,g.EMBED_CONTENT,e,!1,JSON.stringify(n),o);return s.json()}async function batchEmbedContents(e,t,n,o){let s=n.requests.map(e=>Object.assign(Object.assign({},e),{model:t})),r=await makeModelRequest(t,g.BATCH_EMBED_CONTENTS,e,!1,JSON.stringify({requests:s}),o);return r.json()}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let GenerativeModel=class GenerativeModel{constructor(e,t,n={}){this.apiKey=e,this._requestOptions=n,t.model.includes("/")?this.model=t.model:this.model=`models/${t.model}`,this.generationConfig=t.generationConfig||{},this.safetySettings=t.safetySettings||[],this.tools=t.tools,this.toolConfig=t.toolConfig,this.systemInstruction=formatSystemInstruction(t.systemInstruction),this.cachedContent=t.cachedContent}async generateContent(e,t={}){var n;let o=formatGenerateContentInput(e),s=Object.assign(Object.assign({},this._requestOptions),t);return generateContent(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null===(n=this.cachedContent)||void 0===n?void 0:n.name},o),s)}async generateContentStream(e,t={}){var n;let o=formatGenerateContentInput(e),s=Object.assign(Object.assign({},this._requestOptions),t);return generateContentStream(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null===(n=this.cachedContent)||void 0===n?void 0:n.name},o),s)}startChat(e){var t;return new ChatSession(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null===(t=this.cachedContent)||void 0===t?void 0:t.name},e),this._requestOptions)}async countTokens(e,t={}){let n=formatCountTokensInput(e,{model:this.model,generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:this.cachedContent}),o=Object.assign(Object.assign({},this._requestOptions),t);return countTokens(this.apiKey,this.model,n,o)}async embedContent(e,t={}){let n=formatEmbedContentInput(e),o=Object.assign(Object.assign({},this._requestOptions),t);return embedContent(this.apiKey,this.model,n,o)}async batchEmbedContents(e,t={}){let n=Object.assign(Object.assign({},this._requestOptions),t);return batchEmbedContents(this.apiKey,this.model,e,n)}};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let GoogleGenerativeAI=class GoogleGenerativeAI{constructor(e){this.apiKey=e}getGenerativeModel(e,t){if(!e.model)throw new GoogleGenerativeAIError("Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })");return new GenerativeModel(this.apiKey,e,t)}getGenerativeModelFromCachedContent(e,t,n){if(!e.name)throw new GoogleGenerativeAIRequestInputError("Cached content must contain a `name` field.");if(!e.model)throw new GoogleGenerativeAIRequestInputError("Cached content must contain a `model` field.");for(let n of["model","systemInstruction"])if((null==t?void 0:t[n])&&e[n]&&(null==t?void 0:t[n])!==e[n]){if("model"===n){let n=t.model.startsWith("models/")?t.model.replace("models/",""):t.model,o=e.model.startsWith("models/")?e.model.replace("models/",""):e.model;if(n===o)continue}throw new GoogleGenerativeAIRequestInputError(`Different value for "${n}" specified in modelParams (${t[n]}) and cachedContent (${e[n]})`)}let o=Object.assign(Object.assign({},t),{model:e.model,tools:e.tools,toolConfig:e.toolConfig,systemInstruction:e.systemInstruction,cachedContent:e});return new GenerativeModel(this.apiKey,o,n)}}}}]);