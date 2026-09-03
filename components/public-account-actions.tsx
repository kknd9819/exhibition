'use client';
export function PublicAccountActions({loginHref}:{loginHref:string}){async function logout(){await fetch('/api/public-auth/logout',{method:'POST'});location.href=loginHref;}return <button onClick={logout}>退出登录</button>}
