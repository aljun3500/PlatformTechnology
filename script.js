'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const KEY='bashReviewerV1';
let S={done:[],labs:[],quiz:{},last:null,dark:false,exam:''};
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

/* ---------- helpers ---------- */
const hl=c=>esc(c).replace(/(^#.*$)|("[^"]*")|(\$\(\(|\$\w+)|\b(if|then|elif|else|fi|for|in|do|done|while)\b/gm,(m,a,b,v)=>a?`<i class=c>${m}</i>`:b?`<i class=s>${m}</i>`:v?`<i class=v>${m}</i>`:`<i class=k>${m}</i>`);
const cb=(code,out,notes,title)=>`<div class="cb">${title?`<div class="cbt">${title}</div>`:''}<button class="copy" onclick="copyCode(this)">Copy</button><pre><code>${hl(code)}</code></pre>${out!=null?`<div class="out"><b>Expected output</b><pre>${esc(out)}</pre></div>`:''}${notes?`<ol class="notes">${notes.map(n=>`<li><code>${esc(n[0])}</code> — ${n[1]}</li>`).join('')}</ol>`:''}</div>`;
function copyCode(b){const t=b.parentElement.querySelector('code').innerText;const ok=()=>{b.textContent='Copied!';setTimeout(()=>b.textContent='Copy',1200)};
 if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(ok,()=>fb(t,ok));else fb(t,ok)}
function fb(t,ok){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');ok()}catch(e){}a.remove()}
const sl=h=>`<div class="blk slide"><span class="tag">From slides</span>${h}</div>`;
const ad=(t,h)=>`<details class="blk add" open><summary><span class="tag a">Added</span>${t}</summary>${h}</details>`;
const ul=a=>`<ul>${a.map(x=>`<li>${x}</li>`).join('')}</ul>`;
const tb=(h,r)=>`<div style="overflow:auto"><table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${r.map(x=>`<tr>${x.map(y=>`<td>${y}</td>`).join('')}</tr>`).join('')}</table></div>`;

/* ---------- lesson data ---------- */
const CMDS=[
['pwd','Prints the full path of the directory you are currently in.','Displays the current directory','pwd','pwd','/home/student','The shell asks the operating system for the working directory and prints its absolute path.'],
['ls','Lists the files and folders inside a directory.','List files and folders','ls [options] [path]','ls -la','drwxr-xr-x 3 student student 4096 Documents\n-rw-r--r-- 1 student student   17 notes.txt','ls reads the directory contents. -l gives a long listing and -a includes hidden files. (The example <code>ls -la</code> is on the slides.)'],
['cd','Moves you into another directory.','Changes the current directory','cd <directory>','cd Documents\npwd','/home/student/Documents','cd updates the shell\'s working directory. cd .. goes up one level.'],
['touch','Creates a new, empty file if it does not exist.','Creates an empty file if needed','touch <file>','touch notes.txt\nls','notes.txt','If notes.txt is missing, touch creates it with no content. If it exists, nothing is erased.'],
['cp','Copies a file or directory to a new location or name.','Copies files or directories','cp <source> <destination>','cp notes.txt backup.txt\nls','backup.txt  notes.txt','cp duplicates the source and leaves the original untouched. Use -r for directories.'],
['mv','Moves a file to another place, or renames it.','Moves or renames files','mv <old> <new>','mv backup.txt archive.txt\nls','archive.txt  notes.txt','The same name inside the same folder means a rename; a different folder means a move.'],
['rm','Deletes files.','Removes files','rm <file>','rm archive.txt\nls','notes.txt','rm removes the file immediately. <b>Important (slides): rm can permanently delete data.</b>'],
['cat','Prints the contents of a file.','Displays file contents','cat <file>','cat hello.txt','Hello, Bash!','cat reads the file and writes its text to the terminal.'],
['echo','Prints text or the value of a variable.','Prints text or variable values','echo "text"','echo "Hello"','Hello','echo writes its arguments to the output. With a variable: <code>echo "$name"</code>.'],
['find','Searches for files and directories by name or other criteria.','Searches for files and directories','find <path> -name "<pattern>"','find . -name "*.txt"','./hello.txt\n./notes.txt','find walks through the path and its subfolders and prints every match. "." means the current directory.']];
const cmdHtml=CMDS.map(c=>`<details class="card"><summary><code>${c[0]}</code> — ${c[2]}</summary>
<p><b>Definition</b> <span class="tag a">Added</span> ${c[1]}</p><p><b>Purpose</b> <span class="tag">From slides</span> ${c[2]}</p><p><b>Syntax</b></p>${cb(c[3])}
${cb(c[4],c[5],null,'Practical example')}<p><b>How it works</b> <span class="tag a">Added</span> ${c[6]}</p></details>`).join('');

const LS=[
{t:'Introduction to Scripting',h:()=>sl(`<h3>What is scripting?</h3><p>A scripting language is a programming language used to automate tasks, control software, manage files, and perform repetitive operations. Scripts are sets of instructions that a computer executes to complete a specific task. Many scripting languages are <i>interpreted</i> by another program, such as a shell or runtime environment, unlike traditional programs that are often compiled into standalone executable files.</p>
<h3>Examples of scripting languages</h3>${ul(['<b>Bash</b> — command-line operations and Linux system administration.','<b>Python</b> — automation, data processing, and web development.','<b>JavaScript</b> — interactive features for websites and automating certain applications.','<b>PowerShell</b> — system administration and automation, particularly on Windows.'])}
<h3>Why are scripting languages important?</h3>${ul(['They reduce repetitive manual work.','They save time and improve productivity.','They help minimize human errors.','They can execute multiple commands automatically.','They simplify system maintenance and server administration.'])}`)},
{t:'Introduction to Bash',h:()=>sl(`<h3>What is Bash?</h3><p>Bash stands for <b>Bourne Again SHell</b>. It is a command-line shell commonly used in Linux and also available on other Unix-like systems. It lets users communicate with the operating system by entering commands, and it can execute commands from a file containing a series of instructions.</p>${cb('ls -la')}
<h3>What is Bash scripting?</h3><p>Writing a series of Bash commands in a text file so they run automatically as a single program. A script typically has the <code>.sh</code> extension, although that extension is optional. Scripts can contain commands, variables, loops, conditions, and functions.</p>
<h3>What is a shell?</h3><p>A shell is a program that provides an interface between the user and the operating system. It can be used interactively through a terminal or to execute commands stored in a script.</p>
<h3>Common types of shells</h3>${tb(['Shell','Description'],[['Bash','Commonly used in Linux'],['sh','A basic Unix shell'],['Zsh','A shell with extra features'],['Fish','A user-friendly shell'],['PowerShell','Commonly used in Windows']])}
<h3>Terminal vs shell</h3><p>A <b>terminal</b> is the application where you type commands, while a <b>shell</b> is the program that reads and runs those commands.</p>`)},
{t:'Common Bash Commands',h:()=>sl(`<p>Bash commands allow users to navigate directories, manage files, inspect system information, and control running processes. They can be combined in scripts to perform more complex tasks. <b>Important: commands such as <code>rm</code> can permanently delete data.</b></p>`)+`<p class="mut">Open each command below. Then practice in the <a href="#terminal">Terminal Simulator</a>.</p>`+cmdHtml},
{t:'Variables',h:()=>sl(`<h3>What are variables in Bash?</h3><p>A variable is a named container used to store information that a script can access and reuse. Variables can store text, numbers, file paths, dates, and the output of commands.</p>`)+ad('Declaring, assigning, accessing',ul(['<b>Declare/assign:</b> <code>name="Alex"</code> — no spaces around <code>=</code>.','<b>Access:</b> put <code>$</code> before the name, e.g. <code>$name</code>.']))+cb(`#!/bin/bash
name="Alex"
age=20
echo "Name: $name"
echo "Age: $age"`,'Name: Alex\nAge: 20',[['name="Alex"','Creates the variable <code>name</code> holding text.'],['age=20','Creates <code>age</code> holding a number.'],['echo "Name: $name"','<code>$name</code> is replaced by its value before printing.']],'Example 2: Variables (from slides)')},
{t:'Conditions',h:()=>sl(`<h3>What are conditions?</h3><p>A condition allows a script to make a decision based on whether a test is true or false. The <code>if</code>, <code>elif</code>, and <code>else</code> statements are commonly used, and <code>fi</code> ends the block.</p>`)+cb(`#!/bin/bash
score=85
if [ "$score" -ge 75 ] ; then
  echo "Passed"
else
  echo "Failed"
fi`,'Passed',[['score=85','Stores the score.'],['if [ "$score" -ge 75 ]','Tests if score is greater than or equal to 75.'],['then / else','Runs one branch depending on the test.'],['fi','Closes the if statement.']],'Example 3: Pass or fail checker (from slides)')+sl(`<h3>Common comparison operators</h3>${tb(['Operator','Meaning'],[['-eq','Equal to'],['-ne','Not equal to'],['-gt','Greater than'],['-lt','Less than'],['-ge','Greater than or equal to'],['-le','Less than or equal to'],['-f','Checks whether a regular file exists'],['-d','Checks whether a directory exists']])}`)+ad('elif, positive/negative checker, file checker',`<p><code>elif</code> adds another test between <code>if</code> and <code>else</code>. Keep spaces inside <code>[ ]</code>.</p>`+cb(`#!/bin/bash
num=-5
if [ "$num" -gt 0 ]; then
  echo "Positive"
elif [ "$num" -lt 0 ]; then
  echo "Negative"
else
  echo "Zero"
fi`,'Negative',[['-gt 0','True for numbers above zero.'],['elif ... -lt 0','Checked only if the first test failed.'],['else','Runs when num is exactly 0.']],'Example 4: Positive or negative checker')+cb(`#!/bin/bash
file="notes.txt"
if [ -f "$file" ]; then
  echo "File exists"
else
  echo "File not found"
fi`,'File not found  (if notes.txt does not exist)',[['-f "$file"','True only if it is a regular file.'],['-d','Use <code>-d</code> instead to test for a directory.']],'Example 7: File existence checker'))},
{t:'Loops',h:()=>sl(`<h3>What is a loop?</h3><p>A loop repeats a set of commands. Loops are useful when the same task must be performed multiple times.</p>`)+cb(`#!/bin/bash
for number in 1 2 3 4 5
do
  echo "Number: $number"
done`,'Number: 1\nNumber: 2\nNumber: 3\nNumber: 4\nNumber: 5',[['for number in 1 2 3 4 5','<code>number</code> takes each listed value in turn.'],['do ... done','Marks the loop body.'],['echo "Number: $number"','Runs once per value.']],'Example 5: for loop (from slides)')+cb(`#!/bin/bash
count=1
while [ "$count" -le 3 ]
do
  echo "Count: $count"
  count=$((count + 1))
done`,'Count: 1\nCount: 2\nCount: 3',[['count=1','Starting value.'],['while [ "$count" -le 3 ]','Keeps looping while count is at most 3.'],['count=$((count + 1))','Adds 1 each time; without it the loop never ends.']],'Example 6: while loop (from slides)')+ad('for vs while',ul(['<b>for</b> — goes through a known list of items.','<b>while</b> — repeats as long as a condition stays true.']))},
{t:'Bash Script Files',h:()=>sl(`<h3>What is a .sh file?</h3><p>A <code>.sh</code> file is a text file containing a series of Bash commands that can be executed automatically as a single program (a Bash script). The extension stands for <i>shell script</i>, though using it in Bash is optional.</p>`)+ad('Shebang and creating a script',`<p>The <b>shebang</b> <code>#!/bin/bash</code> on the first line tells the system which interpreter runs the file. (The slide examples use it; the word "shebang" is additional vocabulary.)</p><ol><li>Open an editor: <code>nano script.sh</code></li><li>Type the commands, starting with the shebang.</li><li>Save (Ctrl+O, Enter) and exit (Ctrl+X).</li><li>Run it (next lesson).</li></ol>`+cb(`#!/bin/bash
echo "Hello, World!"`,'Hello, World!',[['#!/bin/bash','Shebang: use Bash as interpreter.'],['echo "Hello, World!"','Prints the message.']],'Example 1: Hello World'))},
{t:'Executing Bash Scripts',h:()=>sl(`<p>To execute a Bash script, you run the script file inside a shell so the interpreter executes its stored commands sequentially. On Linux/Unix, you typically grant execute permission with <code>chmod +x script.sh</code> and run it using <code>./script.sh</code>, or run it directly with the interpreter using <code>bash script.sh</code>.</p>`)+ad('The four commands',tb(['Command','What it does'],[['nano script.sh','Opens/creates the file in the nano editor'],['chmod +x script.sh','Gives the file execute permission'],['./script.sh','Runs the script from the current directory (needs execute permission)'],['bash script.sh','Runs it through Bash directly (no execute permission needed)']])+cb(`nano script.sh
chmod +x script.sh
./script.sh
bash script.sh`,'Hello, World!\nHello, World!',null,'Typical workflow'))},
{t:'Bash Automation',h:()=>sl(`<p>Using Bash, you can automate:</p>${ul(['<b>System Administration Tasks:</b> automating general maintenance and operating system controls.','<b>Executing Commands:</b> running multiple Linux commands sequentially without manual intervention.','<b>File &amp; Directory Management:</b> automating operations involving files and folders.','<b>Running Programs &amp; Scripts:</b> triggering and managing software executions, external programs, or other scripts.','<b>Process &amp; Job Scheduling:</b> managing running processes and scheduling automated background jobs.'])}`)+ad('Example 8: Creating folders and files',cb(`#!/bin/bash
mkdir -p study
touch study/notes.txt
echo "Folder and file created"
ls study`,'Folder and file created\nnotes.txt',[['mkdir -p study','Creates the folder (no error if it exists).'],['touch study/notes.txt','Creates an empty file inside it.'],['ls study','Lists the folder to confirm.']]))},
{t:'Linux Server Automation',h:()=>sl(`<h3>Examples of Linux server automation</h3>${ul(['<b>Scheduled Backups &amp; Maintenance:</b> automatically creating backups of important directories and databases, then cleaning up old log files.','<b>Automated System Updates:</b> running package manager commands (e.g. <code>apt update &amp;&amp; apt upgrade</code>) to keep packages updated.','<b>User &amp; File Management:</b> creating users, modifying file permissions, and managing server directory structures in bulk.','<b>Server Health Monitoring:</b> automated checks of disk usage, CPU utilization, and running processes, with conditions/loops to send notifications or restart failing services.'])}`)+ad('Sample backup script',cb(`#!/bin/bash
src="$HOME/Documents"
dest="$HOME/backup"
mkdir -p "$dest"
cp -r "$src" "$dest"
echo "Backup completed"`,'Backup completed',[['mkdir -p "$dest"','Makes sure the backup folder exists.'],['cp -r','Copies the folder recursively.']]))}
];

/* ---------- quiz data (l: 1 easy, 2 intermediate, 3 advanced) ---------- */
const Q=(l,t,q,o,a,e)=>({l,t,q,o,a,e});
const BANK=[
Q(1,'mcq','What does Bash stand for?',['Bourne Again SHell','Basic Automated SHell','Binary Access SHell','Bourne Active System Host'],0,'Slide 4: Bash stands for Bourne Again SHell.'),
Q(1,'tf','A terminal is the program that reads and runs commands.',null,false,'The terminal is where you type commands; the shell reads and runs them.'),
Q(1,'mcq','Which command displays the current directory?',['pwd','ls','cd','cat'],0,'pwd displays the current directory.'),
Q(1,'mcq','Which command creates an empty file if needed?',['touch','cat','echo','find'],0,'touch creates an empty file if needed.'),
Q(1,'multi','Select the scripting languages named in the slides.',['Bash','Python','JavaScript','PowerShell','HTML'],[0,1,2,3],'The slides list Bash, Python, JavaScript and PowerShell.'),
Q(1,'id','Which command searches for files and directories? (one word)',null,['find'],'find searches for files and directories.'),
Q(1,'mcq','Which command moves or renames files?',['cp','mv','rm','ls'],1,'mv moves or renames files.'),
Q(1,'tf','Commands such as rm can permanently delete data.',null,true,'Slide 8 warns that rm can permanently delete data.'),
Q(1,'mcq','What file extension does a Bash script typically have?',['.sh','.bash.txt','.exe','.py'],0,'Scripts typically use .sh, though it is optional.'),
Q(1,'multi','Which of these are shells named in the slides?',['Bash','sh','Zsh','Fish','Chrome'],[0,1,2,3],'Bash, sh, Zsh, Fish (and PowerShell) are listed.'),
Q(2,'out','What is the output?\nscore=85\nif [ "$score" -ge 75 ]; then echo "Passed"; else echo "Failed"; fi',['Passed','Failed','85','Nothing'],0,'85 is greater than or equal to 75, so "Passed" prints.'),
Q(2,'mcq','What does -ne mean?',['Equal to','Not equal to','Next entry','Not empty'],1,'-ne means not equal to.'),
Q(2,'syn','Which line correctly assigns a variable?',['name="Alex"','name = "Alex"','$name="Alex"','set name Alex'],0,'No spaces around = and no $ when assigning.'),
Q(2,'id','Which operator checks whether a directory exists?',null,['-d'],'-d checks whether a directory exists.'),
Q(2,'out','What is the output?\nfor n in 1 2 3\ndo echo "N$n"\ndone',['N1 N2 N3 on separate lines','N n N n N n','N123','Nothing'],0,'The loop prints once for each value.'),
Q(2,'out','How many lines are printed?\ncount=1\nwhile [ "$count" -le 3 ]\ndo echo "Count: $count"; count=$((count + 1)); done',['3','2','4','Infinite'],0,'It prints for count = 1, 2 and 3.'),
Q(2,'mcq','Which keyword ends an if statement?',['fi','done','end','stop'],0,'fi closes an if block.'),
Q(2,'tf','-f checks whether a directory exists.',null,false,'-f checks for a regular file; -d is for directories.'),
Q(2,'syn','Which line increases count by 1?',['count=$((count + 1))','count++ echo','$count=count+1','add count 1'],0,'Arithmetic expansion $(( )) is used in the slides.'),
Q(2,'id','Which operator means "greater than or equal to"?',null,['-ge'],'-ge = greater than or equal to.'),
Q(3,'syn','Which if statement has correct Bash syntax?',['if [ "$a" -gt 5 ]; then','if ["$a" -gt 5]; then','if [ "$a" > 5 ] then','if ( $a -gt 5 ) fi'],0,'Spaces are needed inside [ ], and then follows the test.'),
Q(3,'mcq','./script.sh gives "Permission denied". What is the fix?',['chmod +x script.sh','rm script.sh','cd script.sh','echo script.sh'],0,'Grant execute permission with chmod +x.'),
Q(3,'mcq','Which command runs a script without execute permission?',['bash script.sh','./script.sh','chmod script.sh','touch script.sh'],0,'bash script.sh passes the file to the interpreter.'),
Q(3,'out','What is the output?\ncount=5\nwhile [ "$count" -le 3 ]; do echo x; done',['Nothing','x','xxx','An error'],0,'The condition is false at the start, so the body never runs.'),
Q(3,'mcq','A script starts with #1/bin/bash. What is wrong?',['It should be #!/bin/bash','It needs a .txt extension','Nothing is wrong','It should be /bin/bash only'],0,'The slide has this typo; the shebang is #!/bin/bash.'),
Q(3,'multi','Which commands can run script.sh after chmod +x?',['./script.sh','bash script.sh','run script.sh','open script.sh'],[0,1],'Slides give ./script.sh and bash script.sh.'),
Q(3,'mcq','Which command is the slide example for automated system updates?',['apt update && apt upgrade','rm -rf /','cd /etc','echo update'],0,'Slide 16 gives apt update && apt upgrade.'),
Q(3,'multi','Which checks does server health monitoring include in the slides?',['Disk usage','CPU utilization','Running processes','Wallpaper colour'],[0,1,2],'Disk usage, CPU utilization and running processes.'),
Q(3,'id','Type the command that gives script.sh execute permission.',null,['chmod +x script.sh'],'chmod +x script.sh'),
Q(3,'tf','if [ -d "backup" ] tests whether backup is a regular file.',null,false,'-d tests for a directory.')
];
const MODES={easy:['Easy',1],mid:['Intermediate',2],adv:['Advanced',3],final:['Final Examination Practice',0]};

/* ---------- progress ---------- */
function stats(){const l=S.done.length,b=S.labs.length,qs=Object.values(S.quiz).map(x=>x.best);
 const qa=qs.length?Math.round(qs.reduce((a,c)=>a+c,0)/qs.length):0;
 const overall=Math.round((l/LS.length*100+b/LABS.length*100+Object.keys(S.quiz).length/4*100)/3);return{l,b,qa,qn:qs.length,overall}}
function refreshBar(){const s=stats();$('#barfill').style.width=s.overall+'%';$('#pct').textContent=s.overall+'% overall'}

/* ---------- navigation ---------- */
const NAVS=[['Overview',[['dashboard','Dashboard']]],['Lessons',LS.map((x,i)=>['lesson-'+(i+1),(i+1)+'. '+x.t])],['Practice',[['terminal','Terminal Simulator'],['quiz','Quiz & Exam Center'],['labs','Laboratory Practice']]]];
const plain=h=>h.replace(/<[^>]+>/g,' ').toLowerCase();
const idx=LS.map(x=>(x.t+' '+plain(x.h())).toLowerCase());
function buildNav(){const cur=location.hash.slice(1)||'dashboard',q=$('#search').value.trim().toLowerCase();
 $('#nav').innerHTML=NAVS.map(g=>{const items=g[1].filter(it=>{if(!q)return true;if(!it[0].startsWith('lesson-'))return it[1].toLowerCase().includes(q);return idx[+it[0].slice(7)-1].includes(q)});
 return items.length?`<h4>${g[0]}</h4>`+items.map(it=>`<a href="#${it[0]}" class="${it[0]===cur?'on':''}"><span>${esc(it[1])}</span><span>${S.done.includes(+it[0].slice(7))&&it[0].startsWith('lesson-')?'✓':''}</span></a>`).join(''):''}).join('')||'<p class="mut" style="padding:8px">No matches</p>'}

function route(){const h=location.hash.slice(1)||'dashboard',m=$('#main');$('#side').classList.remove('open');window.scrollTo(0,0);
 if(h.startsWith('lesson-')){const n=+h.slice(7);if(LS[n-1]){S.last=n;save();lessonView(n);}else location.hash='dashboard'}
 else if(h==='terminal')termView();else if(h==='quiz')quizHome();else if(h==='labs')labsView();else dashView();
 buildNav();refreshBar()}

/* ---------- dashboard ---------- */
function dashView(){const s=stats(),next=S.last||1;let left='';
 if(S.exam){const d=Math.ceil((new Date(S.exam+'T00:00:00')-new Date())/864e5);left=isNaN(d)?'':d>0?`${d} day${d>1?'s':''} left`:d===0?'Today!':'Date has passed'}
 $('#main').innerHTML=`<h1>Welcome back, student 👋</h1><p class="sub">Course: <b>Bash Scripting</b> — based on the Group 8 "Scripting" presentation.</p>
 <div class="grid"><div class="card"><div class="mut">Overall progress</div><div class="big">${s.overall}%</div><div class="prog"><i style="width:${s.overall}%"></i></div></div>
 <div class="card"><div class="mut">Lessons completed</div><div class="big">${s.l} / ${LS.length}</div><div class="prog"><i style="width:${s.l*10}%"></i></div></div>
 <div class="card"><div class="mut">Quiz performance (avg best)</div><div class="big">${s.qn?s.qa+'%':'—'}</div><div class="mut">${s.qn} of 4 quizzes taken</div></div>
 <div class="card"><div class="mut">Laboratory practice</div><div class="big">${s.b} / ${LABS.length}</div><div class="prog"><i style="width:${s.b*10}%"></i></div></div></div>
 <div class="card"><h3>Upcoming examination</h3><p class="mut">Quiz and final laboratory examination. Set your date:</p><div class="row" style="margin:0"><input type="date" id="exam" value="${S.exam||''}" style="max-width:200px"><b>${left}</b></div></div>
 <div class="row"><a class="btn pri" href="#lesson-${next}">Continue Learning${S.last?' — Lesson '+next:''}</a><a class="btn" href="#quiz">Take a quiz</a><button id="reset">Reset progress</button></div>
 ${ad('About this reviewer',ul(['Blue-bordered boxes are content taken from the slides; amber boxes are extra explanations or examples I added.','Slide typos corrected: <code>#1/bin/bash</code> → <code>#!/bin/bash</code>; <code>scores=85</code> → <code>score=85</code> (to match <code>$score</code>); curly quotes → straight quotes; "Exzmple" → "Example"; "n Linux" → "in Linux".','The terminal is a simulation only — it never runs real commands on your computer.']))}`;
 $('#exam').onchange=e=>{S.exam=e.target.value;save();dashView()};
 $('#reset').onclick=()=>{if(confirm('Reset all study progress?')){S.done=[];S.labs=[];S.quiz={};S.last=null;save();route()}}}

/* ---------- lesson ---------- */
function lessonView(n){const L=LS[n-1],done=S.done.includes(n);
 $('#main').innerHTML=`<h1>Lesson ${n}: ${L.t}</h1><p class="sub">${done?'✓ Completed':'In progress'}</p>${L.h()}
 <div class="row"><button id="mk" class="${done?'':'good'}">${done?'Mark as not complete':'Mark lesson complete'}</button></div>
 <div class="nav2">${n>1?`<a class="btn" href="#lesson-${n-1}">← Previous</a>`:'<span></span>'}${n<LS.length?`<a class="btn pri" href="#lesson-${n+1}">Next →</a>`:'<a class="btn pri" href="#quiz">Go to quizzes →</a>'}</div>`;
 $('#mk').onclick=()=>{S.done=done?S.done.filter(x=>x!==n):[...S.done,n];save();route()}}

/* ---------- terminal simulator ---------- */
const F=(x,m)=>({t:'f',x,m:m||'rw-r--r--'}),D=c=>({t:'d',c,m:'rwxr-xr-x'});
const mkFS=()=>D({home:D({student:D({Documents:D({'report.txt':F('Quarterly report draft'),'todo.txt':F('1. Review Bash\n2. Practice scripts')}),Projects:D({'hello.sh':F('#!/bin/bash\necho "Hello, World!"','rw-r--r--')}),Downloads:D({}),'notes.txt':F('Bash is a shell.'),'hello.txt':F('Hello, Bash!')})})});
let FS=mkFS(),cwd=['home','student'],hist=[],hp=0;
const parts=p=>{p=p.replace(/^~/,'/home/student');let a=p.startsWith('/')?[]:[...cwd];p.split('/').forEach(s=>{if(!s||s==='.')return;s==='..'?a.pop():a.push(s)});return a};
const get=a=>{let n=FS;for(const s of a){if(n.t!=='d'||!(s in n.c))return null;n=n.c[s]}return n};
const prompt$=()=>'student@ubuntu:'+(('/'+cwd.join('/')).replace('/home/student','~'))+'$ ';
const clone=n=>JSON.parse(JSON.stringify(n));
function destFor(src,dst){const dn=get(dst);if(dn&&dn.t==='d')return[...dst,src[src.length-1]];return dst}
const CMD={
pwd:()=>'/'+cwd.join('/'),
ls(a){const fl=a.filter(x=>x[0]==='-').join(''),ps=a.filter(x=>x[0]!=='-'),p=ps[0]||'.',n=get(parts(p));if(!n)return`ls: cannot access '${p}': No such file or directory`;
 const line=(k,v)=>fl.includes('l')?`${v.t==='d'?'d':'-'}${v.m} 1 student student ${v.t==='d'?4096:v.x.length} ${k}`:k;
 if(n.t==='f')return line(p,n);let ks=Object.keys(n.c).sort();if(!fl.includes('a'))ks=ks.filter(k=>k[0]!=='.');
 return ks.map(k=>line(k,n.c[k])).join(fl.includes('l')?'\n':'  ')},
cd(a){const p=a[0]||'~',ar=parts(p),n=get(ar);if(!n)return`bash: cd: ${p}: No such file or directory`;if(n.t!=='d')return`bash: cd: ${p}: Not a directory`;cwd=ar;return''},
touch(a){if(!a.length)return'touch: missing file operand';const o=[];a.forEach(p=>{const ar=parts(p),par=get(ar.slice(0,-1));if(!par||par.t!=='d')o.push(`touch: cannot touch '${p}': No such file or directory`);else if(!(ar[ar.length-1]in par.c))par.c[ar[ar.length-1]]=F('')});return o.join('\n')},
mkdir(a){const r=a.includes('-p'),ps=a.filter(x=>x[0]!=='-');if(!ps.length)return'mkdir: missing operand';const o=[];ps.forEach(p=>{const ar=parts(p);if(r){let n=FS;ar.forEach(s=>{if(!(s in n.c))n.c[s]=D({});n=n.c[s]});return}
 const par=get(ar.slice(0,-1)),nm=ar[ar.length-1];if(!par||par.t!=='d')o.push(`mkdir: cannot create directory '${p}': No such file or directory`);else if(nm in par.c)o.push(`mkdir: cannot create directory '${p}': File exists`);else par.c[nm]=D({})});return o.join('\n')},
cp(a){const r=a.includes('-r')||a.includes('-R'),ps=a.filter(x=>x[0]!=='-');if(ps.length<2)return'cp: missing destination file operand';const[s,d]=ps,sa=parts(s),sn=get(sa);if(!sn)return`cp: cannot stat '${s}': No such file or directory`;
 if(sn.t==='d'&&!r)return`cp: -r not specified; omitting directory '${s}'`;const da=destFor(sa,parts(d)),par=get(da.slice(0,-1));if(!par||par.t!=='d')return`cp: cannot create regular file '${d}': No such file or directory`;par.c[da[da.length-1]]=clone(sn);return''},
mv(a){const ps=a.filter(x=>x[0]!=='-');if(ps.length<2)return'mv: missing destination file operand';const[s,d]=ps,sa=parts(s),sn=get(sa);if(!sn)return`mv: cannot stat '${s}': No such file or directory`;
 const da=destFor(sa,parts(d)),par=get(da.slice(0,-1));if(!par||par.t!=='d')return`mv: cannot move '${s}' to '${d}': No such file or directory`;delete get(sa.slice(0,-1)).c[sa[sa.length-1]];par.c[da[da.length-1]]=sn;return''},
rm(a){const r=a.includes('-r')||a.includes('-rf')||a.includes('-R'),ps=a.filter(x=>x[0]!=='-');if(!ps.length)return'rm: missing operand';const o=[];ps.forEach(p=>{const ar=parts(p),n=get(ar);if(!ar.length)return o.push('rm: refusing to remove root');if(!n)o.push(`rm: cannot remove '${p}': No such file or directory`);else if(n.t==='d'&&!r)o.push(`rm: cannot remove '${p}': Is a directory`);else delete get(ar.slice(0,-1)).c[ar[ar.length-1]]});return o.join('\n')},
cat(a){if(!a.length)return'cat: missing file operand';return a.map(p=>{const n=get(parts(p));return!n?`cat: ${p}: No such file or directory`:n.t==='d'?`cat: ${p}: Is a directory`:n.x}).join('\n')},
echo:a=>a.join(' '),
find(a){const ni=a.indexOf('-name'),pat=ni>-1?a[ni+1]:null,p=(a[0]&&a[0][0]!=='-')?a[0]:'.',n=get(parts(p));if(!n)return`find: '${p}': No such file or directory`;
 const re=pat?new RegExp('^'+pat.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\?/g,'.')+'$'):null,out=[],base=p.replace(/\/$/,'');
 (function w(n,s){const nm=s.split('/').pop();if(!re||re.test(nm))out.push(s);if(n.t==='d')Object.keys(n.c).sort().forEach(k=>w(n.c[k],s+'/'+k))})(n,base);return out.join('\n')},
chmod(a){if(a.length<2)return'chmod: missing operand';const[m,...fs]=a,o=[];fs.forEach(p=>{const n=get(parts(p));if(!n){o.push(`chmod: cannot access '${p}': No such file or directory`);return}
 if(/^[0-7]{3}$/.test(m))n.m=[...m].map(d=>'r-'[(d&4)?0:1].replace('-','-')&&((d&4)?'r':'-')+((d&2)?'w':'-')+((d&1)?'x':'-')).join('');
 else if(m==='+x')n.m=n.m.replace(/-(?=.?.?.?.?.?.?.?.?$)/g,(c,i)=>i%3===2?'x':c);else if(m==='-x')n.m=n.m.replace(/x/g,'-');else o.push(`chmod: invalid mode: '${m}'`)});return o.join('\n')},
help:()=>'Supported: pwd ls cd touch cp mv rm cat echo find mkdir chmod\nExtras: help, history, clear, reset (restore sample files)',
history:()=>hist.map((h,i)=>' '+(i+1)+'  '+h).join('\n')};
function termRun(line){const out=$('#tout');out.insertAdjacentHTML('beforeend',`<div><span class="pg">${esc(prompt$().slice(0,-2))}</span>$ ${esc(line)}</div>`);line=line.trim();if(!line)return;hist.push(line);hp=hist.length;
 let res,m=line.match(/^echo\s+(.*?)\s*(>>?)\s*(\S+)\s*$/);const tok=s=>(s.match(/"[^"]*"|'[^']*'|\S+/g)||[]).map(x=>x.replace(/^(["'])(.*)\1$/,'$2'));
 if(line==='clear'){out.innerHTML='';return}if(line==='reset'){FS=mkFS();cwd=['home','student'];res='Sample files restored.'}
 else if(m){const ar=parts(m[3]),par=get(ar.slice(0,-1));if(!par||par.t!=='d')res=`bash: ${m[3]}: No such file or directory`;else{const t=tok(m[1]).join(' ')+'\n',ex=par.c[ar[ar.length-1]];
  if(ex&&ex.t==='d')res=`bash: ${m[3]}: Is a directory`;else{par.c[ar[ar.length-1]]=F(m[2]==='>>'&&ex?ex.x+'\n'+t.trim():t.trim(),ex?ex.m:undefined);res=''}}}
 else{const t=tok(line),c=t.shift();res=CMD.hasOwnProperty(c)?CMD[c](t):`bash: ${c}: command not found (simulator supports: pwd, ls, cd, touch, cp, mv, rm, cat, echo, find, mkdir, chmod)`}
 if(res)out.insertAdjacentHTML('beforeend',`<div class="${/^(bash|ls:|cd:|cat:|rm:|cp:|mv:|find:|touch:|mkdir:|chmod:)/.test(res)?'er':''}">${esc(res)}</div>`);out.scrollTop=out.scrollHeight}
function termView(){$('#main').innerHTML=`<h1>Terminal Simulator</h1><p class="sub">A browser-only simulation with sample files. It never runs real commands on your computer. Type <code>help</code> to start.</p>
 <div class="term"><div class="tbar"><span>student@ubuntu: simulated</span><button id="tclr">Clear</button></div><div id="tout"></div><div class="tin"><span id="tp"></span><input id="tin" autocomplete="off" spellcheck="false" aria-label="Terminal input"></div></div>
 <p class="mut">Try: <code>ls</code> · <code>cd Documents</code> · <code>mkdir study</code> · <code>touch a.txt</code> · <code>echo "Hi" &gt; a.txt</code> · <code>cat a.txt</code> · <code>cp a.txt b.txt</code> · <code>mv b.txt c.txt</code> · <code>find . -name "*.txt"</code> · <code>chmod +x hello.sh</code> · <code>rm a.txt</code> · ↑/↓ for history</p>`;
 const i=$('#tin'),tp=()=>$('#tp').textContent=prompt$();tp();i.focus();$('#tout').insertAdjacentHTML('beforeend','<div>Welcome to the Bash practice terminal. Type <b>help</b>.</div>');
 i.onkeydown=e=>{if(e.key==='Enter'){termRun(i.value);i.value='';tp()}else if(e.key==='ArrowUp'){if(hp>0)i.value=hist[--hp]||'';e.preventDefault()}else if(e.key==='ArrowDown'){hp=Math.min(hp+1,hist.length);i.value=hist[hp]||'';e.preventDefault()}};
 $('#tclr').onclick=()=>{$('#tout').innerHTML='';i.focus()}}

/* ---------- quiz ---------- */
let QZ=null;
function quizHome(){QZ=null;$('#main').innerHTML=`<h1>Quiz & Examination Center</h1><p class="sub">Questions are randomized every attempt. Types: multiple choice, true/false, multiple answer, identification, output prediction, syntax identification.</p>
 <div class="grid">${Object.entries(MODES).map(([k,v])=>{const n=v[1]?BANK.filter(q=>q.l===v[1]).length:BANK.length,s=S.quiz[k];return`<div class="card"><h3>${v[0]}</h3><p class="mut">${n} questions${k==='easy'?' · definitions & basic commands':k==='mid'?' · variables, conditions, operators, loops':k==='adv'?' · scripting & troubleshooting':' · all topics'}</p><p>${s?`Best: <b>${s.best}%</b> · Last: ${s.last}%`:'Not attempted'}</p><button class="pri" onclick="startQuiz('${k}')">Start</button></div>`}).join('')}</div>`}
function startQuiz(mode){const lv=MODES[mode][1],pool=shuffle(lv?BANK.filter(q=>q.l===lv):BANK);
 QZ={mode,i:0,score:0,wrong:[],items:pool.map(q=>({...q,opts:q.t==='tf'?[{t:'True',ok:q.a===true},{t:'False',ok:q.a===false}]:q.t==='id'?null:shuffle(q.o.map((t,i)=>({t,ok:Array.isArray(q.a)?q.a.includes(i):q.a===i})))}))};quizQ()}
const TL={mcq:'Multiple choice',tf:'True / False',multi:'Multiple answer',id:'Identification',out:'Output prediction',syn:'Bash syntax'};
function quizQ(){const q=QZ.items[QZ.i],multi=q.t==='multi';
 $('#main').innerHTML=`<h1>${MODES[QZ.mode][0]}</h1><p class="sub">Question ${QZ.i+1} of ${QZ.items.length} · Score so far: ${QZ.score}</p><div class="prog"><i style="width:${QZ.i/QZ.items.length*100}%"></i></div>
 <div class="card"><span class="lv" style="margin:0">${TL[q.t]}${multi?' — select all that apply':''}</span><p style="white-space:pre-wrap;font-weight:600">${esc(q.q)}</p>
 <div id="opts">${q.opts?q.opts.map((o,i)=>`<label class="opt"><input type="${multi?'checkbox':'radio'}" name="o" value="${i}"><span>${esc(o.t)}</span></label>`).join(''):'<input type="text" id="idans" placeholder="Type your answer" autocomplete="off">'}</div>
 <div class="row"><button class="pri" id="sub">Submit answer</button></div><div id="res"></div></div>`;$('#sub').onclick=()=>quizCheck(q)}
function quizCheck(q){let ok,ans;const norm=s=>s.toLowerCase().replace(/["'`]/g,'').replace(/\s+/g,' ').trim();
 if(q.opts){const sel=$$('#opts input').map((x,i)=>x.checked?i:-1).filter(i=>i>-1);if(!sel.length)return alert('Choose an answer first.');ok=q.opts.every((o,i)=>o.ok===sel.includes(i));ans=q.opts.filter(o=>o.ok).map(o=>o.t).join(' | ');
  $$('#opts .opt').forEach((l,i)=>{if(q.opts[i].ok)l.classList.add('ok');else if(sel.includes(i))l.classList.add('no');l.firstChild.disabled=true})}
 else{const v=$('#idans').value;if(!v.trim())return alert('Type an answer first.');ok=q.a.map(norm).includes(norm(v));ans=q.a[0];$('#idans').disabled=true}
 if(ok)QZ.score++;else QZ.wrong.push({q:q.q,ans,e:q.e});
 $('#sub').disabled=true;const last=QZ.i===QZ.items.length-1;
 $('#res').innerHTML=`<div class="fb ${ok?'ok':'no'}"><b>${ok?'✓ Correct!':'✗ Not quite.'}</b>${ok?'':' Correct answer: <code>'+esc(ans)+'</code>'}<br>${esc(q.e)}</div><div class="row"><button class="pri" id="nx">${last?'See results':'Next question →'}</button></div>`;
 $('#nx').onclick=()=>{if(last)quizEnd();else{QZ.i++;quizQ()}}}
function quizEnd(){const n=QZ.items.length,p=Math.round(QZ.score/n*100),prev=S.quiz[QZ.mode];S.quiz[QZ.mode]={best:Math.max(p,prev?prev.best:0),last:p};save();refreshBar();const m=QZ.mode;
 $('#main').innerHTML=`<h1>Results — ${MODES[m][0]}</h1><div class="card"><div class="big">${QZ.score} / ${n} (${p}%)</div><p>${p>=75?'Great work! 🎉':'Keep reviewing and try again.'}</p><div class="row"><button class="pri" onclick="startQuiz('${m}')">Retake quiz</button><button onclick="quizHome()">Back to quiz center</button></div></div>
 <h2>Review incorrect answers (${QZ.wrong.length})</h2>${QZ.wrong.length?QZ.wrong.map(w=>`<div class="card"><p style="white-space:pre-wrap"><b>${esc(w.q)}</b></p><p>Correct: <code>${esc(w.ans)}</code></p><p class="mut">${esc(w.e)}</p></div>`).join(''):'<p class="mut">Perfect score — nothing to review.</p>'}`}

/* ---------- labs ---------- */
const LB=(t,l,task,req,hint,sol,why)=>({t,l,task,req,hint,sol,why});
const LABS=[
LB('Hello World script','Easy','Create a script named hello.sh that prints a greeting.','Hello, World!','Start with the shebang line, then use echo.','#!/bin/bash\necho "Hello, World!"','The shebang selects Bash; echo prints the text.'),
LB('Student information variables','Easy','Create variables for name, age and course, then print them.','Name: Alex\nAge: 20\nCourse: BSIT','Assign with no spaces around =. Access with $.','#!/bin/bash\nname="Alex"\nage=20\ncourse="BSIT"\necho "Name: $name"\necho "Age: $age"\necho "Course: $course"','Each variable is stored once and reused in echo.'),
LB('Pass or fail checker','Easy','Print Passed if score is at least 75, otherwise Failed (score = 85).','Passed','Use -ge inside [ ] and close with fi.','#!/bin/bash\nscore=85\nif [ "$score" -ge 75 ]; then\n  echo "Passed"\nelse\n  echo "Failed"\nfi','-ge tests greater than or equal to; the else branch handles scores below 75.'),
LB('Positive or negative checker','Intermediate','For num=-5 print Positive, Negative or Zero.','Negative','You need if, elif and else.','#!/bin/bash\nnum=-5\nif [ "$num" -gt 0 ]; then\n  echo "Positive"\nelif [ "$num" -lt 0 ]; then\n  echo "Negative"\nelse\n  echo "Zero"\nfi','Tests run top to bottom; the first true one wins.'),
LB('For loop 1 to 5','Easy','Print the numbers 1 to 5 using a for loop.','Number: 1\nNumber: 2\nNumber: 3\nNumber: 4\nNumber: 5','for number in 1 2 3 4 5 … do … done','#!/bin/bash\nfor number in 1 2 3 4 5\ndo\n  echo "Number: $number"\ndone','The loop variable takes each value in the list.'),
LB('While countdown','Intermediate','Count down from 5 to 1, then print Liftoff!','5\n4\n3\n2\n1\nLiftoff!','Use -ge 1 and decrease the variable with $(( )).','#!/bin/bash\ncount=5\nwhile [ "$count" -ge 1 ]\ndo\n  echo "$count"\n  count=$((count - 1))\ndone\necho "Liftoff!"','The loop stops once count drops below 1.'),
LB('File existence check','Intermediate','Check whether notes.txt exists and print a message.','File exists  (or)  File not found','-f tests for a regular file.','#!/bin/bash\nfile="notes.txt"\nif [ -f "$file" ]; then\n  echo "File exists"\nelse\n  echo "File not found"\nfi','-f is true only for a regular file.'),
LB('Folder and text file','Easy','Create a folder named study with notes.txt inside, then list it.','notes.txt','mkdir, touch, ls.','#!/bin/bash\nmkdir -p study\ntouch study/notes.txt\nls study','-p avoids an error if the folder already exists.'),
LB('Copy and rename files','Intermediate','Copy notes.txt to backup.txt, then rename backup.txt to notes_copy.txt.','notes.txt  notes_copy.txt','cp copies; mv renames.','#!/bin/bash\ncp notes.txt backup.txt\nmv backup.txt notes_copy.txt\nls','cp keeps the original; mv with a new name in the same folder renames.'),
LB('Simple backup script','Advanced','Copy $HOME/Documents into $HOME/backup, but only if Documents exists. Print Backup completed.','Backup completed','Use -d to check the folder, mkdir -p for the destination, cp -r to copy.','#!/bin/bash\nsrc="$HOME/Documents"\ndest="$HOME/backup"\nif [ -d "$src" ]; then\n  mkdir -p "$dest"\n  cp -r "$src" "$dest"\n  echo "Backup completed"\nelse\n  echo "Source folder not found"\nfi','Combines a condition with file commands, as in the slides\' scheduled-backup example (extra example, not in slides).')];
function labsView(){const b=S.labs.length;
 $('#main').innerHTML=`<h1>Laboratory Practice</h1><p class="sub">${b} of ${LABS.length} completed. Write your own answer first, then reveal the solution. Run your script in a real Linux shell to test it.</p><div class="prog"><i style="width:${b*10}%"></i></div>
 ${LABS.map((c,i)=>`<details class="card" ${i===0?'open':''}><summary>${S.labs.includes(i)?'✓ ':''}Challenge ${i+1}: ${c.t} <span class="lv">${c.l}</span></summary>
 <p><b>Task:</b> ${c.task}</p><p><b>Required output:</b></p><pre style="background:#020617;color:#86efac;padding:8px 12px;border-radius:8px;overflow:auto">${esc(c.req)}</pre>
 <textarea id="ans${i}" placeholder="Type your script here…" spellcheck="false"></textarea>
 <div class="row"><button onclick="$('#h${i}').hidden=!$('#h${i}').hidden">Show hint</button><button class="pri" onclick="revealSol(${i})">Reveal solution</button><label><input type="checkbox" ${S.labs.includes(i)?'checked':''} onchange="labDone(${i},this.checked)"> Mark complete</label></div>
 <p id="h${i}" hidden class="fb ok">💡 ${c.hint}</p><div id="s${i}"></div></details>`).join('')}`}
function revealSol(i){if(!$('#ans'+i).value.trim())return alert('Try writing an attempt first — then reveal the solution.');const c=LABS[i];$('#s'+i).innerHTML=cb(c.sol,null,null,'Expected solution')+`<p><b>Explanation:</b> ${c.why}</p>`}
function labDone(i,v){S.labs=v?[...new Set([...S.labs,i])]:S.labs.filter(x=>x!==i);save();refreshBar()}

/* ---------- init ---------- */
function applyTheme(){document.body.classList.toggle('dk',!!S.dark)}
$('#dark').onclick=()=>{S.dark=!S.dark;save();applyTheme()};
$('#menu').onclick=()=>$('#side').classList.toggle('open');
$('#search').oninput=buildNav;
window.addEventListener('hashchange',route);
applyTheme();route();
