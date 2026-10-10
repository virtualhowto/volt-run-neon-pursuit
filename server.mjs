import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {attachRooms} from './rooms.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.glb':'model/gltf-binary','.png':'image/png'};
export function createServer(){
 const server=http.createServer(async(req,res)=>{
  if(req.url==='/health'){res.writeHead(200,{'Content-Type':'application/json'});return res.end('{"ok":true}');}
  try{const url=new URL(req.url,'http://localhost');const pathname=decodeURIComponent(url.pathname);const base=pathname.startsWith('/vendor/three/')?path.join(root,'node_modules/three'):path.join(root,'public');const rel=pathname.startsWith('/vendor/three/')?pathname.slice(14):pathname==='/'?'index.html':pathname.slice(1);const file=path.resolve(base,rel);if(!file.startsWith(base+path.sep))throw Error('path');const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}
 });
 server.multiplayer=attachRooms(server);return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT)||8080;createServer().listen(port,'0.0.0.0',()=>console.log(`VOLT RUN http://localhost:${port}`));}
