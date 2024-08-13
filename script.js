import { content } from "./profileMd.js"

document.getElementById('content').innerHTML =
  marked.parse(content);