let id = pm.environment.get("center-platform.id");
let key = pm.environment.get("center-platform.key");

// contentType 目前固定为: application/json
let contentType = "application/json";

// 处理url path
// URL：不带域名，包含uri和query参数，如"/api_url?app_id=aaaa
let url = '';
let path = pm.request.url.path;
let query = pm.request.url.query;
let matchpath = path.map((item) => {
	if (item.startsWith("{{")) {
		let env_key = item.replace("{{", "").replace("}}", "");
		return pm.environment.get(env_key);
	}
	return item;
})
url = `/${matchpath.join('/')}`;
// 处理url query 
// query返回类型为object 但无法通过正常手段判空
// hook : Object.keys(query.toObject())
if (query && Object.keys(query.toObject()).length !== 0) {
	let querypath = query.map((item) => {
		if (item.value.startsWith("{{")) {
			let env_key = item.value.replace("{{", "").replace("}}", "");
			return `${item.key}=${pm.environment.get(env_key)}`;
		}
		return `${item.key}=${item.value}`
	});
	url = `${url}?${querypath.join('&')}`;
}
console.log(url)
// 处理 body content md5 ( 默认 body 均为 raw json)
// HTTP Body中数据的md5 值十六进制表达方式，如果参数 不带在body，则算空字符串""的md5 值

let contentMd5 = CryptoJS.MD5("").toString();
var body = pm.request.body;

if (body.mode == 'raw') {
	body_data = body['raw'];
	contentMd5 = CryptoJS.MD5(body_data).toString();
}

// 处理时间 
// 格式: Wed, 23 Jan 2013 06:43:08 GMT
let date = new Date(Date.now()).toUTCString();

// 签名
// "WPS-3:" + AppId + ":" + sha1(AppKey + Content-Md5 + URL + Content-Type + Date)

let authorizationSha1 = CryptoJS.SHA1(key + contentMd5 + url + contentType + date);
let auth = `WPS-3:${id}:${authorizationSha1}`;
pm.environment.set("header.md5", contentMd5);
pm.environment.set("header.date", date);
pm.environment.set("header.x-auth", auth);
