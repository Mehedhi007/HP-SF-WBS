const DEFAULT_ITEMS = [
{id:1,level:"task",category:"REVIEW",parentId:null,name:"Receive complete drawings & scope",owner:"Technical",pred:[],duration:1,summary:false,color:"#203A5F"},
{id:2,level:"task",category:"REVIEW",parentId:null,name:"BM initial technical review / RFIs",owner:"Technical",pred:[1],duration:2,summary:false,color:"#4C78A8"},

{id:3,level:"task",category:"DESIGN",parentId:null,name:"LGS Design - Vertex BD",owner:"LGS Design",pred:[2],duration:0,summary:true,color:"#2D6EA3"},
{id:31,level:"subtask",category:"DESIGN",parentId:3,name:"Ground Floor LGS",owner:"LGS Design",pred:[2],duration:2,summary:false,color:"#2D6EA3"},
{id:32,level:"subtask",category:"DESIGN",parentId:3,name:"First Floor LGS",owner:"LGS Design",pred:[31],duration:2,summary:false,color:"#3A78B8"},
{id:33,level:"subtask",category:"DESIGN",parentId:3,name:"Roof LGS",owner:"LGS Design",pred:[32],duration:1,summary:false,color:"#5A93CA"},

{id:4,level:"task",category:"DESIGN",parentId:null,name:"Structural Steel Detailing",owner:"Steel Detail",pred:[2],duration:0,summary:true,color:"#E08B31"},
{id:41,level:"subtask",category:"DESIGN",parentId:4,name:"Beam / Column Detailing",owner:"Steel Detail",pred:[2],duration:3,summary:false,color:"#E08B31"},
{id:42,level:"subtask",category:"DESIGN",parentId:4,name:"Connection / Cleat Detailing",owner:"Steel Detail",pred:[41],duration:2,summary:false,color:"#B86825"},

{id:5,level:"task",category:"DESIGN",parentId:null,name:"BM coordination + technical review",owner:"Technical",pred:[33,42],duration:2,summary:false,color:"#7761A8"},
{id:6,level:"task",category:"APPROVE",parentId:null,name:"Structural engineering review / sign-off",owner:"Engineer",pred:[5],duration:5,summary:false,color:"#9B6FC2"},
{id:7,level:"task",category:"APPROVE",parentId:null,name:"Steel material purchasing (early)",owner:"Purchasing",pred:[5],duration:2,summary:false,color:"#D9A12E"},
{id:8,level:"task",category:"APPROVE",parentId:null,name:"Final design check + production release",owner:"Technical",pred:[6],duration:1,summary:false,color:"#168B86"},
{id:9,level:"task",category:"PRODUCE",parentId:null,name:"LGS manufacture",owner:"Production",pred:[8],duration:7,summary:false,color:"#3A9FBF"},
{id:10,level:"task",category:"PRODUCE",parentId:null,name:"Steel fabrication + finishing",owner:"Fabricator",pred:[7,8],duration:10,summary:false,color:"#B86825"},
{id:11,level:"task",category:"PRODUCE",parentId:null,name:"Steel QA + dispatch prep",owner:"Steel / QA",pred:[10],duration:2,summary:false,color:"#2E8B67"},
{id:12,level:"task",category:"PRODUCE",parentId:null,name:"LGS QA + packing",owner:"Production",pred:[9],duration:2,summary:false,color:"#7D8B3E"},
{id:13,level:"task",category:"PRODUCE",parentId:null,name:"Site + installer readiness",owner:"Builder / Install",pred:[8],duration:12,summary:false,color:"#557995"},
{id:14,level:"task",category:"INSTALL",parentId:null,name:"Delivery + site staging",owner:"Logistics",pred:[11,12,13],duration:2,summary:false,color:"#3A8B5F"},
{id:15,level:"task",category:"INSTALL",parentId:null,name:"INSTALLATION COMMENCEMENT",owner:"Installation",pred:[14],duration:0,summary:false,color:"#1F6B4F"}
];

const STAGES = {
REVIEW:{color:"#203A5F",desc:"Builder drawings + technical check"},
DESIGN:{color:"#2D6EA3",desc:"LGS + structural steel"},
APPROVE:{color:"#7761A8",desc:"Engineer + production release"},
PRODUCE:{color:"#168B86",desc:"Manufacture + QA"},
INSTALL:{color:"#257A5E",desc:"Delivery + installation"}
};
const CATEGORIES = Object.keys(STAGES);
const COLORS = ["#203A5F","#4C78A8","#2D6EA3","#3A78B8","#5A93CA","#E08B31","#B86825","#7761A8","#9B6FC2","#D9A12E","#168B86","#3A9FBF","#2E8B67","#7D8B3E","#557995","#3A8B5F","#1F6B4F","#B85C76","#8A6248"];

let items = loadItems();

function cloneDefault(){ return JSON.parse(JSON.stringify(DEFAULT_ITEMS)); }
function loadItems(){
  try{
    const v = localStorage.getItem("bmRoadmapItemsV2");
    return v ? JSON.parse(v) : cloneDefault();
  }catch{return cloneDefault();}
}
function saveItems(){localStorage.setItem("bmRoadmapItemsV2",JSON.stringify(items));}
function esc(v){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]));}

function sortedItems(list){
  const tasks=list.filter(x=>x.level==="task");
  const subtasks=list.filter(x=>x.level==="subtask");
  const out=[];
  for(const c of CATEGORIES){
    for(const task of tasks.filter(t=>t.category===c)){
      out.push(task);
      out.push(...subtasks.filter(s=>Number(s.parentId)===Number(task.id)));
    }
  }
  // any unmatched items
  for(const x of list){ if(!out.some(y=>Number(y.id)===Number(x.id))) out.push(x); }
  return out;
}

function calculate(list){
  const byId = new Map(list.map(t=>[Number(t.id),t]));
  const memo = new Map(), visiting = new Set();

  function normalItem(t){
    const predEnds=(t.pred||[]).map(p=>endOf(Number(p))).filter(Number.isFinite);
    const start=predEnds.length?Math.max(...predEnds):0;
    const dur=Math.max(0,Number(t.duration)||0);
    return {start,end:start+dur};
  }

  function endOf(id){
    if(memo.has(id)) return memo.get(id).end;
    const t=byId.get(Number(id));
    if(!t) return 0;
    if(visiting.has(id)) throw new Error(`Circular dependency involving task ${id}`);
    visiting.add(id);

    let result;
    if(t.level==="task" && t.summary){
      const children=list.filter(x=>x.level==="subtask" && Number(x.parentId)===Number(t.id));
      if(children.length){
        const ranges=children.map(ch=>{ endOf(Number(ch.id)); return memo.get(Number(ch.id)); });
        result={start:Math.min(...ranges.map(r=>r.start)),end:Math.max(...ranges.map(r=>r.end))};
      }else{
        result=normalItem(t);
      }
    }else{
      result=normalItem(t);
    }

    memo.set(id,result); visiting.delete(id); return result.end;
  }

  // calculate non-summary items first to avoid summary/child recursion ambiguity
  list.filter(x=>!(x.level==="task"&&x.summary)).forEach(t=>endOf(Number(t.id)));
  list.filter(x=>x.level==="task"&&x.summary).forEach(t=>endOf(Number(t.id)));
  return memo;
}

function render(){
  let schedule;
  try{schedule=calculate(items);}
  catch(e){alert(e.message);return;}

  const maxEnd=Math.max(30,...[...schedule.values()].map(x=>x.end));
  document.getElementById("workingDays").textContent=maxEnd;

  const pr=items.find(t=>String(t.name).toLowerCase().includes("production release"));
  const inst=items.find(t=>String(t.name).toLowerCase().includes("installation commencement"));
  document.getElementById("productionRelease").textContent=pr?`D${schedule.get(Number(pr.id)).end}`:"—";
  document.getElementById("installationStart").textContent=inst?`D${schedule.get(Number(inst.id)).end}`:"—";

  document.getElementById("flowCards").innerHTML=CATEGORIES.map((c,i)=>`<article class="flow-card" style="--stage:${STAGES[c].color}">
    <strong>${String(i+1).padStart(2,"0")} · ${c}</strong><span>${STAGES[c].desc}</span></article>`).join("");

  const used=[...new Map(sortedItems(items).map(t=>[`${t.level}:${t.name}`,t.color])).entries()];
  document.getElementById("legend").innerHTML=used.slice(0,18).map(([n,c])=>`<span class="legend-item"><i class="swatch" style="--c:${c}"></i>${esc(n.split(":")[1])}</span>`).join("");

  const days=Array.from({length:30},(_,i)=>i+1);
  const header=`<div class="g-row header">
    <div class="g-cell meta">ID</div><div class="g-cell meta">CATEGORY</div><div class="g-cell meta">TASK / SUBTASK</div>
    <div class="g-cell meta">OWNER</div><div class="g-cell meta">PRED.</div>
    ${days.map(d=>`<div class="g-cell g-day ${Math.floor((d-1)/5)%2?"week-alt":""}">${d}</div>`).join("")}
    <div class="g-cell">END</div></div>`;

  let previousCategory="";
  const rows=sortedItems(items).map(t=>{
    const s=schedule.get(Number(t.id))||{start:0,end:0};
    const categoryText=t.category!==previousCategory?esc(t.category):"";
    previousCategory=t.category;
    const label=t.level==="subtask"
      ? `<span class="subtask-label">${esc(t.name)}</span>`
      : `<span class="task-label">${esc(t.name)}</span>`;
    const rowClass=t.summary?" summary-row":"";
    const cells=days.map(d=>{
      const active=d>s.start && d<=s.end && s.end>s.start;
      const milestone=s.end===s.start && d===s.end;
      let visual="";
      if(active){
        visual=t.summary
          ? `<span class="summary-bar" style="--bar:${t.color}"></span>`
          : `<span class="bar" style="--bar:${t.color}"></span>`;
      }else if(milestone){
        visual=`<span class="milestone" style="--bar:${t.color}"></span>`;
      }
      return `<div class="g-cell g-day ${Math.floor((d-1)/5)%2?"week-alt":""}">${visual}</div>`;
    }).join("");
    return `<div class="g-row task-row${rowClass}">
      <div class="g-cell meta">${String(t.id)}</div>
      <div class="g-cell meta category-label">${categoryText}</div>
      <div class="g-cell meta">${label}</div>
      <div class="g-cell meta owner">${esc(t.owner)}</div>
      <div class="g-cell meta pred">${(t.pred||[]).join(",")||"—"}</div>
      ${cells}<div class="g-cell end">D${s.end}</div></div>`;
  }).join("");

  document.getElementById("gantt").innerHTML=header+rows;
}

function taskOptions(selectedId){
  return `<option value="">—</option>`+items.filter(x=>x.level==="task").map(t=>
    `<option value="${t.id}" ${Number(selectedId)===Number(t.id)?"selected":""}>${t.id} · ${esc(t.name)}</option>`).join("");
}

function renderEditor(){
  const body=document.getElementById("editorBody");
  body.innerHTML=sortedItems(items).map((t,idx)=>{
    const rawIndex=items.findIndex(x=>Number(x.id)===Number(t.id));
    const parentDisabled=t.level!=="subtask"?"disabled":"";
    const summaryDisabled=t.level!=="task"?"disabled":"";
    return `<tr data-idx="${rawIndex}">
      <td><input class="id-cell" type="number" min="1" value="${t.id}"></td>
      <td><select class="level"><option value="task" ${t.level==="task"?"selected":""}>Task</option><option value="subtask" ${t.level==="subtask"?"selected":""}>Subtask</option></select></td>
      <td><select class="category">${CATEGORIES.map(c=>`<option ${c===t.category?"selected":""}>${c}</option>`).join("")}</select></td>
      <td><select class="parent" ${parentDisabled}>${taskOptions(t.parentId)}</select></td>
      <td><input class="name" value="${esc(t.name)}"></td>
      <td><input class="ownerin" value="${esc(t.owner)}"></td>
      ${[0,1,2].map(i=>`<td><input class="predin p${i}" type="number" min="1" value="${t.pred?.[i]??""}"></td>`).join("")}
      <td><input class="duration" type="number" min="0" value="${t.duration}"></td>
      <td><input class="summary" type="checkbox" ${t.summary?"checked":""} ${summaryDisabled}></td>
      <td><input class="color" type="color" value="${t.color||COLORS[idx%COLORS.length]}"></td>
      <td><button type="button" class="delete-btn">Delete</button></td></tr>`;
  }).join("");

  body.querySelectorAll(".delete-btn").forEach(btn=>btn.addEventListener("click",e=>{
    const row=e.target.closest("tr"), idx=Number(row.dataset.idx), victim=items[idx];
    if(victim.level==="task"){
      const children=items.filter(x=>x.level==="subtask"&&Number(x.parentId)===Number(victim.id));
      if(children.length && !confirm(`This task has ${children.length} subtask(s). Delete the task and all its subtasks?`)) return;
      items=items.filter(x=>Number(x.id)!==Number(victim.id)&&Number(x.parentId)!==Number(victim.id));
    }else{
      items.splice(idx,1);
    }
    renderEditor();
  }));

  body.querySelectorAll(".level").forEach(sel=>sel.addEventListener("change",e=>{
    const row=e.target.closest("tr");
    row.querySelector(".parent").disabled=e.target.value!=="subtask";
    row.querySelector(".summary").disabled=e.target.value!=="task";
  }));
}

function collectEditor(){
  const rows=[...document.querySelectorAll("#editorBody tr")];
  const updated=rows.map(row=>{
    const q=s=>row.querySelector(s);
    const level=q(".level").value;
    const pred=[q(".p0").value,q(".p1").value,q(".p2").value].filter(Boolean).map(Number);
    const parentId=level==="subtask" && q(".parent").value ? Number(q(".parent").value) : null;
    return {id:Number(q(".id-cell").value),level,category:q(".category").value,parentId,
      name:q(".name").value.trim(),owner:q(".ownerin").value.trim(),pred,
      duration:Math.max(0,Number(q(".duration").value)||0),
      summary:level==="task" ? q(".summary").checked : false,color:q(".color").value};
  });

  const ids=updated.map(x=>x.id);
  if(new Set(ids).size!==ids.length) throw new Error("Task IDs must be unique.");
  if(updated.some(x=>!x.id||!x.name)) throw new Error("Every task/subtask needs an ID and name.");
  for(const x of updated){
    if(x.level==="subtask"){
      const p=updated.find(y=>Number(y.id)===Number(x.parentId)&&y.level==="task");
      if(!p) throw new Error(`Subtask ${x.id} must have a valid Parent Task.`);
      x.category=p.category;
    }
    if((x.pred||[]).some(p=>Number(p)===Number(x.id))) throw new Error(`Task ${x.id} cannot depend on itself.`);
  }
  calculate(updated);
  return updated;
}

function nextId(){
  let n=Math.max(0,...items.map(x=>Number(x.id)||0))+1;
  while(items.some(x=>Number(x.id)===n)) n++;
  return n;
}

document.getElementById("editBtn").addEventListener("click",()=>{renderEditor();document.getElementById("editorDialog").showModal();});
document.getElementById("printBtn").addEventListener("click",()=>window.print());

document.getElementById("addTaskBtn").addEventListener("click",()=>{
  items.push({id:nextId(),level:"task",category:"DESIGN",parentId:null,name:"New task",owner:"",pred:[],duration:1,summary:false,color:COLORS[items.length%COLORS.length]});
  renderEditor();
});

document.getElementById("addSubtaskBtn").addEventListener("click",()=>{
  const parents=items.filter(x=>x.level==="task");
  if(!parents.length){alert("Add a parent task first.");return;}
  const parent=parents[parents.length-1];
  items.push({id:nextId(),level:"subtask",category:parent.category,parentId:parent.id,name:"New subtask",owner:parent.owner||"",pred:[],duration:1,summary:false,color:parent.color||COLORS[items.length%COLORS.length]});
  renderEditor();
});

document.getElementById("saveBtn").addEventListener("click",()=>{
  const msg=document.getElementById("editorMessage");
  msg.style.color="#166534";
  try{
    items=collectEditor();saveItems();render();renderEditor();
    msg.textContent="Saved. Task/subtask hierarchy and Gantt updated.";
  }catch(e){msg.textContent=e.message;msg.style.color="#b91c1c";}
});

document.getElementById("resetBtn").addEventListener("click",()=>{
  if(confirm("Reset to the default BM Sydney roadmap?")){items=cloneDefault();saveItems();renderEditor();render();}
});

document.getElementById("exportBtn").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(items,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="bm-sydney-roadmap-v2.json";a.click();URL.revokeObjectURL(a.href);
});

document.getElementById("importFile").addEventListener("change",async e=>{
  const file=e.target.files[0];if(!file)return;
  const msg=document.getElementById("editorMessage");
  try{
    const imported=JSON.parse(await file.text());
    if(!Array.isArray(imported))throw new Error("Invalid roadmap JSON.");
    calculate(imported);
    items=imported;saveItems();renderEditor();render();msg.textContent="Imported successfully.";msg.style.color="#166534";
  }catch(err){msg.textContent=err.message;msg.style.color="#b91c1c";}
});

render();
