export type Schedule={id:number;title:string;dueDate:string;priority:number;completed:boolean;category:string};
const KEY='our-home-management-schedules';
export function loadSchedules():Schedule[]{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
export function saveSchedules(v:Schedule[]){localStorage.setItem(KEY,JSON.stringify(v))}
export function addSchedule(title:string,dueDate:string,priority:number){const v=loadSchedules();v.push({id:Date.now(),title,dueDate,priority,completed:false,category:'가족일정'});saveSchedules(v);return v}
export function completeSchedule(id:number){const v=loadSchedules().map(x=>x.id===id?{...x,completed:true}:x);saveSchedules(v);return v}
export function exportJSON(){return JSON.stringify({schema_version:1,export_date:new Date().toISOString(),schedules:loadSchedules()},null,2)}
export function exportCSV(){const rows=loadSchedules();return ['id,title,due_date,priority,completed,category',...rows.map(x=>[x.id,x.title,x.dueDate,x.priority,x.completed,x.category].map(v=>`"${String(v).replaceAll('"','""')}"`).join(','))].join('\n')}
