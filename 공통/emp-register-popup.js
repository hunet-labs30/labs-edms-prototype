/* emp-register-popup.js
 * 임직원 등록 팝업 모듈 — 다른 페이지에서 재사용 가능
 *
 * 사용법:
 *   1) <script src="../공통/emp-register-popup.js"></script>
 *   2) 페이지 초기화 시 meMbrInit() 호출:
 *      meMbrInit({
 *        getRegistered : () => MY_REG_ARRAY,
 *        onRegister    : (members) => { ... },
 *        getCompanies  : () => ['회사 전체', '동아ST', ...],
 *      });
 *
 * 공개 API:
 *   meOpenMemberSingleModal()  — 개별/분류별 탭으로 팝업 열기
 *   meOpenMemberBatchModal()   — 일괄등록 탭으로 팝업 열기
 *   meMbrInit(config)          — 설정 주입 (페이지 로드 후 1회 호출)
 *
 * 의존성:
 *   _maskN(name)  / _maskL(loginId) / _maskE(empno)  — 마스킹 헬퍼
 *   (선언이 없으면 내부 폴백 함수 사용)
 */

// ── 호스트 페이지 설정 ──────────────────────────────────────────────────
let _meMbrConfig = {
  getRegistered : () => [],
  onRegister    : null,
  getCompanies  : () => ['회사 선택'],
};

function meMbrInit(config) {
  _meMbrConfig = Object.assign({}, _meMbrConfig, config);
  _meMbrInjectDOM();
}

// ── 마스킹 폴백 ────────────────────────────────────────────────────────
function _mbr_maskN(n) {
  if (typeof _maskN === 'function') return _maskN(n);
  if (!n) return '-';
  return n.length <= 1 ? n : n[0] + '*'.repeat(n.length - 1);
}
function _mbr_maskL(id) {
  if (typeof _maskL === 'function') return _maskL(id);
  if (!id) return '-';
  const at = id.indexOf('@');
  if (at > 1) return id[0] + '*'.repeat(Math.min(at - 1, 3)) + id.slice(at);
  return id.length <= 2 ? id : id[0] + '*'.repeat(id.length - 2) + id.slice(-1);
}
function _mbr_maskE(e) {
  if (typeof _maskE === 'function') return _maskE(e);
  return e || '-';
}

// ── 샘플 데이터 ──────────────────────────────────────────────────────
const ME_SAMPLE_MEMBERS = [
  {name:'홍길동',  loginId:'hong@hunet.co.kr',           empno:'20240001', company:'동아ST',          dept:'인사팀'},
  {name:'이수연',  loginId:'leesy@hunet.co.kr',           empno:'20230002', company:'동아ST',          dept:'기획팀'},
  {name:'김민준',  loginId:'kimm@hunet.co.kr',            empno:'20220010', company:'동아ST',          dept:'안전팀'},
  {name:'박지현',  loginId:'parkjh@hunet.co.kr',          empno:'20210020', company:'동아쏘시오홀딩스', dept:'HR팀'},
  {name:'최서연',  loginId:'choisy@hunet.co.kr',          empno:'20200030', company:'동아ST',          dept:'교육팀'},
  {name:'정유진',  loginId:'jungyj9902@hunet.co.kr',      empno:'20190040', company:'동아쏘시오홀딩스', dept:'재무팀'},
  {name:'강동원',  loginId:'kangdw3312@hunet.co.kr',      empno:'20180050', company:'동아ST',          dept:'전략팀'},
  {name:'이강은',  loginId:'leegeun0011@hunet.co.kr',     empno:'20250001', company:'동아ST',          dept:'기획팀'},
];

const MBR_TARGET_TYPES = [
  {
    typeId: 't1', typeName: '법정의무교육 대상',
    divs: [
      { divId: 'd1', divName: '사무직 전체',  members: ME_SAMPLE_MEMBERS.slice(0,5) },
      { divId: 'd2', divName: '현장직 전체',  members: ME_SAMPLE_MEMBERS.slice(5,8) },
      { divId: 'd3', divName: '신규 입사자',  members: ME_SAMPLE_MEMBERS.slice(0,3) },
    ]
  },
  {
    typeId: 't2', typeName: '직급 그룹',
    divs: [
      { divId: 'd4', divName: '사원/대리',    members: ME_SAMPLE_MEMBERS.slice(0,4) },
      { divId: 'd5', divName: '과장/차장',    members: ME_SAMPLE_MEMBERS.slice(2,6) },
      { divId: 'd6', divName: '부장 이상',    members: ME_SAMPLE_MEMBERS.slice(6,8) },
    ]
  },
  {
    typeId: 't3', typeName: '리더십 과정 대상',
    divs: [
      { divId: 'd7', divName: '팀장급',       members: ME_SAMPLE_MEMBERS.filter(m=>m.dept.includes('팀')) },
      { divId: 'd8', divName: '임원급',       members: ME_SAMPLE_MEMBERS.slice(7,8) },
    ]
  },
];

let meMbrTargetTypeIdx = null;

const MBR_DEPT_TREE = [
  { id:'d_corp', name:'동아ST', members:[], children:[
    { id:'d_biz', name:'사업부문', members:[], children:[
      { id:'d_biz_lnd', name:'L&D사업본부', members:[], children:[
        { id:'d_plan', name:'기획팀', members:[
          {name:'이강은',empno:'20250001',loginId:'leeke@hunet.co.kr',   company:'동아ST',dept:'기획팀'},
          {name:'이수연',empno:'20230002',loginId:'leesy@hunet.co.kr',   company:'동아ST',dept:'기획팀'},
        ], children:[
          { id:'d_plan_p1', name:'서비스기획파트', members:[
            {name:'이강은',empno:'20250001',loginId:'leeke@hunet.co.kr',company:'동아ST',dept:'서비스기획파트'},
          ], children:[]},
          { id:'d_plan_p2', name:'플랫폼기획파트', members:[
            {name:'이수연',empno:'20230002',loginId:'leesy@hunet.co.kr',company:'동아ST',dept:'플랫폼기획파트'},
          ], children:[]},
        ]},
        { id:'d_dev', name:'개발팀', members:[
          {name:'김민준',empno:'20220010',loginId:'kimm@hunet.co.kr',   company:'동아ST',dept:'개발팀'},
        ], children:[
          { id:'d_dev_fe', name:'프론트엔드파트', members:[
            {name:'김민준',empno:'20220010',loginId:'kimm@hunet.co.kr', company:'동아ST',dept:'프론트엔드파트'},
          ], children:[]},
          { id:'d_dev_be', name:'백엔드파트', members:[
            {name:'홍길동',empno:'20240001',loginId:'hong@hunet.co.kr', company:'동아ST',dept:'백엔드파트'},
          ], children:[]},
        ]},
        { id:'d_stg', name:'전략팀', members:[
          {name:'강동원',empno:'20180050',loginId:'kangdw@hunet.co.kr', company:'동아ST',dept:'전략팀'},
        ], children:[
          { id:'d_stg_p1', name:'사업전략파트', members:[
            {name:'강동원',empno:'20180050',loginId:'kangdw@hunet.co.kr',company:'동아ST',dept:'사업전략파트'},
          ], children:[]},
        ]},
      ]},
      { id:'d_content', name:'콘텐츠사업본부', members:[], children:[
        { id:'d_content_prod', name:'콘텐츠제작팀', members:[
          {name:'최서연',empno:'20200030',loginId:'choisy@hunet.co.kr', company:'동아ST',dept:'콘텐츠제작팀'},
        ], children:[
          { id:'d_content_p1', name:'영상제작파트', members:[
            {name:'최서연',empno:'20200030',loginId:'choisy@hunet.co.kr',company:'동아ST',dept:'영상제작파트'},
          ], children:[]},
          { id:'d_content_p2', name:'강의기획파트', members:[
            {name:'홍길동2',empno:'20170060',loginId:'hong2@hunet.co.kr',company:'동아ST',dept:'강의기획파트'},
          ], children:[]},
        ]},
      ]},
    ]},
    { id:'d_support', name:'경영지원부문', members:[], children:[
      { id:'d_support_hq', name:'경영지원본부', members:[], children:[
        { id:'d_hr', name:'인사팀', members:[
          {name:'홍길동',empno:'20240001',loginId:'hong@hunet.co.kr',   company:'동아ST',dept:'인사팀'},
        ], children:[
          { id:'d_hr_p1', name:'채용파트', members:[
            {name:'홍길동',empno:'20240001',loginId:'hong@hunet.co.kr', company:'동아ST',dept:'채용파트'},
          ], children:[]},
        ]},
        { id:'d_edu', name:'교육팀', members:[
          {name:'정유진',empno:'20190040',loginId:'jungyj@hunet.co.kr', company:'동아ST',dept:'교육팀'},
        ], children:[]},
        { id:'d_safety', name:'안전환경팀', members:[
          {name:'박지현',empno:'20210020',loginId:'parkjh@hunet.co.kr', company:'동아ST',dept:'안전환경팀'},
        ], children:[]},
      ]},
    ]},
  ]},
  { id:'d_donga', name:'동아쏘시오홀딩스', members:[], children:[
    { id:'d_donga_biz', name:'사업기획본부', members:[], children:[
      { id:'d_donga_hr', name:'HR팀', members:[
        {name:'박지현',empno:'20210020',loginId:'parkjh@hunet.co.kr',  company:'동아쏘시오홀딩스',dept:'HR팀'},
      ], children:[
        { id:'d_donga_hr_p1', name:'인재개발파트', members:[
          {name:'박지현',empno:'20210020',loginId:'parkjh@hunet.co.kr',company:'동아쏘시오홀딩스',dept:'인재개발파트'},
        ], children:[]},
      ]},
      { id:'d_donga_fin', name:'재무팀', members:[
        {name:'정유진',empno:'20190040',loginId:'jungyj@hunet.co.kr',  company:'동아쏘시오홀딩스',dept:'재무팀'},
      ], children:[]},
    ]},
  ]},
];

const MBR_DATA = {
  dept: [],
  grade: [
    { label:'사원',   members:[{name:'이강은',empno:'20250001',company:'동아ST',          dept:'기획팀'},{name:'홍길동',empno:'20240001',company:'동아ST',dept:'대구캠퍼스 바이오제2팀'}] },
    { label:'대리',   members:[{name:'이수연',empno:'20230002',company:'동아ST',          dept:'기획팀'},{name:'김민준',empno:'20220010',company:'동아ST',dept:'안전팀'}] },
    { label:'과장',   members:[{name:'박지현',empno:'20210020',company:'동아쏘시오홀딩스',dept:'HR팀' },{name:'최서연',empno:'20200030',company:'동아ST',dept:'교육팀'}] },
    { label:'차장',   members:[{name:'정유진',empno:'20190040',company:'동아쏘시오홀딩스',dept:'재무팀'}] },
    { label:'부장',   members:[{name:'강동원',empno:'20180050',company:'동아ST',          dept:'전략팀'}] },
  ],
  position: [
    { label:'팀원',   members:[{name:'이강은',empno:'20250001',company:'동아ST',          dept:'기획팀'},{name:'이수연',empno:'20230002',company:'동아ST',dept:'기획팀'}] },
    { label:'팀장',   members:[{name:'강동원',empno:'20180050',company:'동아ST',          dept:'전략팀'},{name:'정유진',empno:'20190040',company:'동아쏘시오홀딩스',dept:'재무팀'}] },
    { label:'본부장', members:[{name:'홍길동2',empno:'20170060',company:'동아ST',         dept:'인사팀'}] },
  ],
  job: [
    { label:'기획',   members:[{name:'이강은',empno:'20250001',company:'동아ST',          dept:'기획팀'},{name:'이수연',empno:'20230002',company:'동아ST',dept:'기획팀'}] },
    { label:'영업',   members:[{name:'홍길동',empno:'20240001',company:'동아ST',          dept:'대구캠퍼스 바이오제2팀'}] },
    { label:'관리',   members:[{name:'정유진',empno:'20190040',company:'동아쏘시오홀딩스',dept:'재무팀'},{name:'박지현',empno:'20210020',company:'동아쏘시오홀딩스',dept:'HR팀'}] },
    { label:'연구개발',members:[{name:'김민준',empno:'20220010',company:'동아ST',          dept:'안전팀'}] },
  ],
  jobgroup: [
    { label:'사무직', members:ME_SAMPLE_MEMBERS.filter(m=>m.company==='동아ST') },
    { label:'현장직', members:ME_SAMPLE_MEMBERS.filter(m=>m.company==='동아쏘시오홀딩스') },
    { label:'연구직', members:[{name:'김민준',empno:'20220010',company:'동아ST',          dept:'안전팀'}] },
  ],
  target: [],
};

// ── 선택 인원 모음 배열 ──────────────────────────────────────────────
const ME_COLLECTED = [];

let meMbrCurSplitType = null;
const meMbrDeptCollapsed = new Set();

// ── DOM 주입 ────────────────────────────────────────────────────────
function _meMbrInjectDOM() {
  if (document.getElementById('me-member-modal')) return;

  const style = document.createElement('style');
  style.id = 'emp-register-popup-style';
  style.textContent = `
/* emp-register-popup — 팝업 전용 CSS */
.mbr-split{display:flex;flex:1;overflow:hidden;gap:0;}
.mbr-left{width:220px;flex-shrink:0;border-right:1px solid var(--border,#e0e3e8);overflow-y:auto;background:#fafafa;}
.mbr-right{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:12px 16px;}
.mbr-left-item{
  padding:9px 12px;font-size:12px;color:#444;cursor:pointer;
  border-bottom:1px solid #f0f2f5;display:flex;align-items:center;justify-content:space-between;
  transition:background .1s;white-space:nowrap;min-width:max-content;
}
.mbr-left-item:hover{background:#f0f4ff;color:var(--primary,#3f61ed);}
.mbr-left-item.selected{background:#e8f0fe;color:var(--primary,#3f61ed);font-weight:600;border-left:3px solid var(--primary,#3f61ed);}
.mbr-left-item .cnt{font-size:10px;background:#dde1e7;color:#555;padding:1px 5px;border-radius:8px;margin-left:6px;flex-shrink:0;}
.mbr-left-item.selected .cnt{background:var(--primary,#3f61ed);color:#fff;}
#me-mbr-dept-breadcrumb{
  display:flex;align-items:center;gap:4px;overflow-x:auto;
  white-space:nowrap;scrollbar-width:none;padding:0 2px;
}
#me-mbr-dept-breadcrumb::-webkit-scrollbar{display:none;}
.mbr-bc-item{font-size:11px;color:#555;flex-shrink:0;}
.mbr-bc-sep{font-size:10px;color:#bbb;flex-shrink:0;}
.mbr-tabbar{display:flex;border-bottom:2px solid #e0e3e8;padding:0 16px;background:#fff;flex-shrink:0;overflow-x:auto;}
.mbr-tabbar::-webkit-scrollbar{height:0;}
.mbr-tab{padding:8px 13px;font-size:12px;font-weight:600;color:#888;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;white-space:nowrap;font-family:inherit;transition:all .15s;}
.mbr-tab:hover{color:var(--primary,#3f61ed);}
.mbr-tab.active{color:var(--primary,#3f61ed);border-bottom-color:var(--primary,#3f61ed);}
#me-member-modal table{width:100%;border-collapse:collapse;table-layout:auto;}
#me-member-modal table th,#me-member-modal table td{border-bottom:1px solid #e8eaed;padding:5px 8px;font-size:12px;vertical-align:middle;text-align:left;}
#me-member-modal table thead th{background:#f0f2f5;font-weight:600;color:#555;white-space:nowrap;}
#me-member-modal table tbody tr:hover{background:#f8f9fc;}
`;
  document.head.appendChild(style);

  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
<div class="modal-overlay" id="me-member-modal" onclick="if(event.target===this)this.style.display='none'" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:3000;align-items:center;justify-content:center;">
  <div style="background:#fff;border-radius:6px;width:960px;height:640px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.22);overflow:hidden;">

    <!-- 헤더 -->
    <div style="padding:13px 20px;border-bottom:1px solid var(--border,#e0e3e8);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
      <span style="font-size:14px;font-weight:700;">대상자 등록</span>
      <span style="cursor:pointer;font-size:20px;color:#aaa;line-height:1;" onclick="document.getElementById('me-member-modal').style.display='none'">×</span>
    </div>

    <!-- 탭바 -->
    <div class="mbr-tabbar">
      <button class="mbr-tab active" onclick="meMbrTab('single',this)">개별</button>
      <button class="mbr-tab" onclick="meMbrTab('dept',this)">부서별</button>
      <button class="mbr-tab" onclick="meMbrTab('grade',this)">직급별</button>
      <button class="mbr-tab" onclick="meMbrTab('position',this)">직책별</button>
      <button class="mbr-tab" onclick="meMbrTab('job',this)">직무별</button>
      <button class="mbr-tab" onclick="meMbrTab('jobgroup',this)">직군별</button>
      <button class="mbr-tab" onclick="meMbrTab('target',this)">대상구분별</button>
      <button class="mbr-tab" onclick="meMbrTab('batch',this)">일괄등록</button>
    </div>

    <!-- 바디: 탭패널 + 우측 공통 선택인원 -->
    <div style="display:flex;flex:1;overflow:hidden;">
    <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;">

    <!-- 개별등록 패널 -->
    <div id="me-mbr-panel-single" style="flex:1;overflow:hidden;display:flex;flex-direction:column;">
      <div style="padding:10px 14px;border-bottom:1px solid var(--border,#e0e3e8);flex-shrink:0;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
        <select class="select" style="height:28px;font-size:12px;width:100px;" id="me-mbr-s-company"></select>
        <select class="select" style="height:28px;font-size:12px;width:76px;" id="me-mbr-s-type">
          <option value="name">이름</option>
          <option value="loginId">아이디</option>
          <option value="phone">휴대번호</option>
          <option value="empNo">사번</option>
          <option value="co">회사</option>
          <option value="dept">부서</option>
          <option value="grade">직급</option>
        </select>
        <input class="input" id="me-mbr-s-kw" style="flex:1;min-width:150px;height:28px;font-size:12px;" placeholder="검색어를 입력해주세요." onkeydown="if(event.key==='Enter')meMbrSingleSearch()">
        <button class="btn btn-primary" style="height:28px;" onclick="meMbrSingleSearch()">&#128269; 검색</button>
        <button class="btn btn-reset" style="height:28px;" onclick="meMbrSingleAll()">전체검색</button>
      </div>
      <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:10px 14px;gap:8px;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
          <span style="font-size:11px;color:#888;">검색 결과: <strong id="me-mbr-s-total">0</strong>명 &nbsp;·&nbsp; 선택: <strong id="me-mbr-s-sel">0</strong>명</span>
          <button class="btn btn-reset" style="height:22px;padding:0 8px;font-size:11px;" onclick="meMbrSingleAddChecked()">추가 →</button>
        </div>
        <div style="border:1px solid var(--border,#e0e3e8);border-radius:4px;overflow:hidden;flex:1;overflow-y:auto;">
          <table class="main-table" style="font-size:12px;">
            <thead style="position:sticky;top:0;z-index:1;background:#f0f2f5;"><tr>
              <th style="width:34px;"><input type="checkbox" id="me-mbr-s-chk-all" onchange="document.querySelectorAll('.me-mbr-s-chk').forEach(c=>c.checked=this.checked);meMbrSelCount()"></th>
              <th>이름</th><th style="width:86px;">아이디</th><th style="width:78px;">사번</th>
              <th style="width:96px;">회사명</th><th style="width:96px;">부서명</th><th style="width:46px;"></th>
            </tr></thead>
            <tbody id="me-mbr-s-tbody"><tr><td colspan="7" style="text-align:center;padding:28px;color:#aaa;">검색 결과가 없습니다.</td></tr></tbody>
          </table>
        </div>
        <div class="table-footer" style="padding:4px 0;flex-shrink:0;">
          <div class="page-size-wrap"><select class="select" style="height:26px;width:56px;"><option>10</option><option selected>30</option><option>50</option></select><span>항목 (페이지 당)</span></div>
          <div class="pagination"><button class="pg-btn">&#8676;</button><button class="pg-btn">&#8249;</button><button class="pg-btn active">1</button><button class="pg-btn">&#8250;</button><button class="pg-btn">&#8677;</button></div>
        </div>
      </div>
    </div>

    <!-- 좌우분할 패널 공통 (부서/직급/직책/직무/직군/대상구분) -->
    <div id="me-mbr-panel-split" style="display:none;flex:1;overflow:hidden;flex-direction:column;">
      <div style="border-bottom:1px solid var(--border,#e0e3e8);flex-shrink:0;background:#fafafa;padding:7px 14px;display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:38px;">
        <div style="flex:1;min-width:0;display:flex;align-items:center;gap:6px;overflow:hidden;">
          <span style="font-size:11px;color:#aaa;flex-shrink:0;" id="me-mbr-split-guide-icon">📁</span>
          <span style="font-size:11px;color:#888;white-space:nowrap;" id="me-mbr-split-guide">좌측에서 항목을 선택하면 해당 인원이 표시됩니다.</span>
          <div id="me-mbr-bc-wrap" style="display:none;align-items:center;min-width:0;overflow:hidden;">
            <div id="me-mbr-dept-breadcrumb"></div>
          </div>
        </div>
      </div>
      <div style="display:flex;flex:1;overflow:hidden;">
        <div style="width:200px;flex-shrink:0;border-right:1px solid var(--border,#e0e3e8);overflow-x:auto;overflow-y:auto;background:#fafafa;" id="me-mbr-left-list"></div>
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid var(--border,#e0e3e8);">
          <div id="me-mbr-right-empty" style="flex:1;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:12px;">
            좌측에서 항목을 클릭하면 인원이 표시됩니다.
          </div>
          <div id="me-mbr-right-content" style="display:none;flex-direction:column;flex:1;overflow:hidden;">
            <div style="padding:8px 12px;border-bottom:1px solid var(--border,#e0e3e8);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:#f8f9fc;">
              <span style="font-size:12px;font-weight:600;color:#333;" id="me-mbr-right-title">-</span>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:11px;color:#888;"><strong id="me-mbr-right-cnt">0</strong>명</span>
                <button class="btn btn-reset" style="height:22px;padding:0 8px;font-size:11px;" onclick="meMbrAddCheckedToCollected()">추가 →</button>
              </div>
            </div>
            <div style="flex:1;overflow-y:auto;">
              <table class="main-table" style="font-size:12px;">
                <thead style="position:sticky;top:0;z-index:1;background:#f0f2f5;"><tr>
                  <th style="width:34px;"><input type="checkbox" id="me-mbr-r-chk-all" onchange="document.querySelectorAll('.me-mbr-r-chk').forEach(c=>c.checked=this.checked)"></th>
                  <th>이름</th><th style="width:78px;">사번</th><th style="width:90px;">부서명</th><th style="width:46px;"></th>
                </tr></thead>
                <tbody id="me-mbr-right-tbody"><tr><td colspan="5" style="text-align:center;padding:20px;color:#aaa;">항목을 선택해주세요.</td></tr></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 일괄등록 패널 -->
    <div id="me-mbr-panel-batch" style="display:none;flex:1;overflow-y:auto;padding:16px 20px;flex-direction:column;gap:12px;">
      <div style="background:#f8f9fb;border:1px solid #e0e3e8;border-radius:6px;padding:10px 14px;font-size:12px;color:#666;line-height:1.8;">
        <div style="font-weight:700;color:#444;margin-bottom:2px;">📋 일괄등록 안내</div>
        <ul style="padding-left:16px;margin:0;">
          <li>엑셀 파일(.xlsx, .xls)로 교육인원을 일괄 등록합니다.</li>
          <li><strong>미리보기</strong>로 오류 확인 후 <strong>등록</strong> 버튼을 눌러주세요.</li>
          <li>오류가 있는 경우 등록 버튼이 비활성화됩니다.</li>
        </ul>
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:#444;margin-bottom:6px;">Step 1. 업로드 양식 다운로드</div>
        <a href="#" style="color:var(--primary,#3f61ed);font-size:12px;" onclick="alert('샘플파일을 다운로드합니다.');return false;">📥 샘플파일 다운로드</a>
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:#444;margin-bottom:6px;">Step 2. 파일 첨부</div>
        <div id="me-mbr-batch-dropzone" onclick="document.getElementById('me-mbr-batch-file').click()"
          style="border:2px dashed #ccc;border-radius:4px;padding:18px;text-align:center;cursor:pointer;color:#aaa;font-size:12px;">
          &#9729; 파일을 등록해주세요 (.xlsx, .xls)
        </div>
        <input type="file" id="me-mbr-batch-file" accept=".xlsx,.xls" style="display:none;" onchange="meMbrBatchSetFile(this.files[0])">
        <div id="me-mbr-batch-fname" style="display:none;font-size:12px;color:#333;margin-top:6px;padding:6px 10px;background:#f8f9fc;border-radius:3px;border:1px solid #e0e3e8;"></div>
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:#444;margin-bottom:6px;">Step 3. 미리보기 및 등록</div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-reset" style="height:30px;padding:0 18px;" onclick="meMbrBatchPreview()">미리보기</button>
          <button id="me-mbr-batch-regist-btn" class="btn btn-primary" style="height:30px;padding:0 18px;background:#e53935;border-color:#e53935;opacity:0.4;cursor:not-allowed;" onclick="meMbrBatchRegist()">등록</button>
          <button class="btn btn-reset" style="height:30px;padding:0 18px;" onclick="document.getElementById('me-member-modal').style.display='none'">닫기</button>
        </div>
      </div>
      <div id="me-mbr-batch-preview-result" style="display:none;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <div style="font-size:12px;font-weight:700;color:#444;">미리보기 결과</div>
          <button id="me-mbr-batch-error-down" onclick="alert('오류내용.xlsx를 다운로드합니다.')"
            style="display:none;height:26px;padding:0 12px;border:1px solid #ccc;border-radius:3px;background:#fff;font-size:11px;color:#555;cursor:pointer;">
            ⬇ 오류내용 다운로드
          </button>
        </div>
        <div style="border:1px solid #e0e3e8;border-radius:4px;overflow:hidden;max-height:150px;overflow-y:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead><tr style="background:#f0f2f5;">
              <th style="padding:7px 12px;border-bottom:1px solid #e0e3e8;text-align:left;color:#555;width:140px;">아이디</th>
              <th style="padding:7px 12px;border-bottom:1px solid #e0e3e8;text-align:left;color:#555;">오류 내용</th>
            </tr></thead>
            <tbody id="me-mbr-batch-preview-tbody"></tbody>
          </table>
        </div>
      </div>
      <div style="font-size:12px;font-weight:600;color:#444;margin-top:2px;">오류내용 정리</div>
      <table class="main-table" style="font-size:12px;">
        <thead><tr><th style="width:160px;text-align:left;padding:8px 12px;">오류 유형</th><th style="text-align:left;padding:8px 12px;">오류 설명</th></tr></thead>
        <tbody>
          <tr><td style="padding:8px 12px;">아이디 미입력</td>   <td style="padding:8px 12px;">아이디를 입력하지 않은 경우</td></tr>
          <tr><td style="padding:8px 12px;">아이디 오류</td>     <td style="padding:8px 12px;">아이디가 존재하지 않는 경우</td></tr>
          <tr><td style="padding:8px 12px;">중복 등록</td>       <td style="padding:8px 12px;">이미 해당 필수교육에 등록된 아이디인 경우</td></tr>
          <tr><td style="padding:8px 12px;">데이터 없음</td>     <td style="padding:8px 12px;">파일에 등록 가능한 데이터가 없는 경우</td></tr>
          <tr><td style="padding:8px 12px;">파일 용량 초과</td>  <td style="padding:8px 12px;">업로드 파일 용량이 허용 범위를 초과한 경우</td></tr>
        </tbody>
      </table>
    </div>

    </div><!-- /탭 패널 래퍼 -->

    <!-- 우측 공통: 선택된 인원 패널 -->
    <div id="me-mbr-collected-panel" style="width:220px;flex-shrink:0;border-left:1px solid var(--border,#e0e3e8);display:flex;flex-direction:column;overflow:hidden;">
      <div style="padding:8px 12px;border-bottom:1px solid var(--border,#e0e3e8);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:#f0f4ff;">
        <span style="font-size:12px;font-weight:700;color:var(--primary,#3f61ed);">선택된 인원</span>
        <div style="display:flex;align-items:center;gap:4px;">
          <span style="font-size:11px;color:#888;" id="me-mbr-collected-cnt2">0명</span>
          <button class="btn btn-reset" style="height:20px;padding:0 6px;font-size:10px;color:#e53935;border-color:#fcc;" onclick="meMbrClearCollected()">전체삭제</button>
        </div>
      </div>
      <div style="flex:1;overflow-y:auto;" id="me-mbr-collected-list">
        <div id="me-mbr-collected-empty" style="display:flex;align-items:center;justify-content:center;height:80px;color:#aaa;font-size:11px;">
          추가 버튼으로 인원을 모아주세요
        </div>
      </div>
      <div style="padding:10px 12px;border-top:1px solid var(--border,#e0e3e8);flex-shrink:0;">
        <button id="me-mbr-final-btn" class="btn btn-primary" style="width:100%;height:30px;background:#e53935;border-color:#e53935;opacity:0.45;cursor:not-allowed;" onclick="meMbrFinalReg()" disabled>선택 인원 등록</button>
      </div>
    </div>

    </div><!-- /바디 래퍼 -->
  </div>
</div>`;
  document.body.appendChild(wrapper.firstElementChild);
}

// ── 선택 인원 모음 로직 ─────────────────────────────────────────────
function meMbrUpdateCollected() {
  const cnt2  = document.getElementById('me-mbr-collected-cnt2');
  const empty = document.getElementById('me-mbr-collected-empty');
  const listEl= document.getElementById('me-mbr-collected-list');
  if (cnt2)  cnt2.textContent  = ME_COLLECTED.length + '명';
  // [선택 인원 등록] 버튼: 선택인원 패널이 비어 있으면 비활성화 (탭 공통)
  const finalBtn = document.getElementById('me-mbr-final-btn');
  if (finalBtn) {
    const has = ME_COLLECTED.length > 0;
    finalBtn.disabled = !has;
    finalBtn.style.opacity = has ? '1' : '0.45';
    finalBtn.style.cursor  = has ? 'pointer' : 'not-allowed';
  }
  if (!ME_COLLECTED.length) {
    if (empty) empty.style.display = 'flex';
    listEl?.querySelectorAll('.mbr-coll-tag').forEach(t => t.remove());
    return;
  }
  if (empty) empty.style.display = 'none';
  listEl?.querySelectorAll('.mbr-coll-tag').forEach(t => t.remove());
  const fragment = document.createDocumentFragment();
  ME_COLLECTED.forEach((m, i) => {
    const tag = document.createElement('div');
    tag.className = 'mbr-coll-tag';
    tag.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:5px 10px;border-bottom:1px solid #f0f2f5;font-size:11px;';
    tag.innerHTML = `<div><span style="font-weight:600;">${_mbr_maskN(m.name)}</span><span style="color:#aaa;margin-left:4px;">${m.dept||''}</span></div>
      <span style="cursor:pointer;color:#aaa;font-size:14px;line-height:1;" onclick="meMbrRemoveCollected(${i})">×</span>`;
    fragment.appendChild(tag);
  });
  if (empty) empty.after(fragment);
  else listEl?.appendChild(fragment);
}

function meMbrAddCheckedToCollected() {
  const checked = [...document.querySelectorAll('.me-mbr-r-chk:checked')];
  if (!checked.length) { alert('추가할 인원을 선택해주세요.'); return; }
  checked.forEach(chk => {
    const row = chk.closest('tr');
    const name = row.dataset.name, empno = row.dataset.empno, loginId = row.dataset.loginid, company = row.dataset.company, dept = row.dataset.dept;
    if (!ME_COLLECTED.find(m => m.empno === empno)) ME_COLLECTED.push({name, loginId, company, empno, dept});
  });
  meMbrUpdateCollected();
}
function meMbrAddRowToCollected(btn) {
  const row = btn.closest('tr');
  const name = row.dataset.name, empno = row.dataset.empno, loginId = row.dataset.loginid, company = row.dataset.company, dept = row.dataset.dept;
  if (!ME_COLLECTED.find(m => m.empno === empno)) ME_COLLECTED.push({name, loginId, company, empno, dept});
  meMbrUpdateCollected();
}
function meMbrAddSingleRowToCollected(btn) {
  const row = btn.closest('tr');
  const name = row.dataset.name, empno = row.dataset.empno, loginId = row.dataset.loginid, company = row.dataset.company, dept = row.dataset.dept;
  if (!ME_COLLECTED.find(m => m.empno === empno)) ME_COLLECTED.push({name, loginId, company, empno, dept});
  meMbrUpdateCollected();
}
function meMbrRemoveCollected(i) { ME_COLLECTED.splice(i, 1); meMbrUpdateCollected(); }
function meMbrClearCollected()   { ME_COLLECTED.length = 0;   meMbrUpdateCollected(); }

// ── 부서 트리 헬퍼 ──────────────────────────────────────────────────
function meMbrGetDeptMembers(node) {
  const result = [...(node.members || [])];
  (node.children || []).forEach(child => result.push(...meMbrGetDeptMembers(child)));
  return result;
}
function meMbrFindDeptNode(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = meMbrFindDeptNode(n.children || [], id);
    if (found) return found;
  }
  return null;
}
function meMbrFindDeptPath(nodes, id, path = []) {
  for (const n of nodes) {
    const cur = [...path, n];
    if (n.id === id) return cur;
    const found = meMbrFindDeptPath(n.children || [], id, cur);
    if (found) return found;
  }
  return null;
}
function meMbrUpdateBreadcrumb(id) {
  const bcWrap = document.getElementById('me-mbr-bc-wrap');
  const bcEl   = document.getElementById('me-mbr-dept-breadcrumb');
  if (!bcWrap || !bcEl) return;
  if (!id) {
    bcWrap.style.display = 'none';
    const guideEl = document.getElementById('me-mbr-split-guide');
    const iconEl  = document.getElementById('me-mbr-split-guide-icon');
    if (guideEl) guideEl.style.display = '';
    if (iconEl)  iconEl.style.display  = '';
    return;
  }
  const path = meMbrFindDeptPath(MBR_DEPT_TREE, id);
  if (!path?.length) { bcWrap.style.display = 'none'; return; }
  bcWrap.style.display = 'flex';
  const guideEl = document.getElementById('me-mbr-split-guide');
  const iconEl  = document.getElementById('me-mbr-split-guide-icon');
  if (guideEl) guideEl.style.display = 'none';
  if (iconEl)  iconEl.style.display  = 'none';
  bcEl.innerHTML = path.map((n, i) =>
    `<span class="mbr-bc-item" style="${i === path.length-1 ? 'color:var(--primary,#3f61ed);font-weight:600;' : ''}">${n.name}</span>`
    + (i < path.length-1 ? '<span class="mbr-bc-sep">›</span>' : '')
  ).join('');
  setTimeout(() => { bcEl.scrollLeft = bcEl.scrollWidth; }, 0);
}
function meMbrRenderDeptTree(nodes, depth = 0) {
  return nodes.map(node => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = meMbrDeptCollapsed.has(node.id);
    const totalMembers = meMbrGetDeptMembers(node).length;
    const indent = depth * 14;
    return `<div>
      <div class="mbr-left-item" id="mbr-dept-${node.id}" style="padding-left:${12+indent}px;" onclick="meMbrSelectDept('${node.id}')">
        <span style="display:flex;align-items:center;gap:4px;flex:1;min-width:0;">
          ${hasChildren
            ? `<span onclick="event.stopPropagation();meMbrToggleDept('${node.id}')" style="font-size:9px;color:#aaa;flex-shrink:0;width:12px;text-align:center;cursor:pointer;">${isCollapsed ? '▶' : '▼'}</span>`
            : '<span style="width:12px;flex-shrink:0;"></span>'}
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${node.name}</span>
        </span>
        <span class="cnt" style="flex-shrink:0;">${totalMembers}</span>
      </div>
      ${hasChildren && !isCollapsed ? `<div>${meMbrRenderDeptTree(node.children, depth+1)}</div>` : ''}
    </div>`;
  }).join('');
}
function meMbrToggleDept(id) {
  if (meMbrDeptCollapsed.has(id)) meMbrDeptCollapsed.delete(id);
  else meMbrDeptCollapsed.add(id);
  const leftEl = document.getElementById('me-mbr-left-list');
  if (leftEl) leftEl.innerHTML = meMbrRenderDeptTree(MBR_DEPT_TREE);
}
function meMbrSelectDept(id) {
  document.querySelectorAll('.mbr-left-item').forEach(el => el.classList.remove('selected'));
  document.getElementById('mbr-dept-' + id)?.classList.add('selected');
  meMbrUpdateBreadcrumb(id);
  const node = meMbrFindDeptNode(MBR_DEPT_TREE, id);
  if (!node) return;
  const members = meMbrGetDeptMembers(node);
  const registered = _meMbrConfig.getRegistered();
  document.getElementById('me-mbr-right-empty').style.display = 'none';
  document.getElementById('me-mbr-right-content').style.display = 'flex';
  document.getElementById('me-mbr-right-title').textContent = node.name;
  document.getElementById('me-mbr-right-cnt').textContent = members.length;
  const tbody = document.getElementById('me-mbr-right-tbody');
  tbody.innerHTML = members.length ? members.map(m => {
    const isReg = registered.some(r => r.empno === m.empno);
    return `<tr data-name="${m.name}" data-empno="${m.empno}" data-loginid="${m.loginId||''}" data-company="${m.company||''}" data-dept="${m.dept||''}"${isReg ? ' style="background:#fafafa;"' : ''}>
    <td style="text-align:center;padding:5px 4px;width:34px;">${isReg ? '<span style="font-size:10px;color:#ccc;">등록됨</span>' : '<input type="checkbox" class="me-mbr-r-chk">'}</td>
    <td style="padding:5px 8px;font-weight:600;${isReg ? 'color:#bbb;' : ''}">${_mbr_maskN(m.name)}</td>
    <td style="padding:5px 8px;color:${isReg ? '#ccc' : '#888'};font-size:11px;width:78px;">${_mbr_maskE(m.empno)}</td>
    <td style="padding:5px 8px;color:${isReg ? '#ccc' : '#888'};font-size:11px;">${m.dept||''}</td>
    <td style="text-align:center;padding:3px 4px;width:46px;">${isReg ? '' : '<button class="btn btn-reset" style="height:20px;padding:0 6px;font-size:11px;" onclick="meMbrAddRowToCollected(this)">추가</button>'}</td>
    </tr>`;
  }).join('') : '<tr><td colspan="5" style="text-align:center;padding:20px;color:#aaa;">해당 부서에 임직원이 없습니다.</td></tr>';
}

// ── 탭 전환 ────────────────────────────────────────────────────────
function meMbrTab(type, btn) {
  document.querySelectorAll('.mbr-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  ['single', 'split', 'batch'].forEach(p => {
    const el = document.getElementById('me-mbr-panel-' + p);
    if (el) el.style.display = 'none';
  });
  const collectedPanel = document.getElementById('me-mbr-collected-panel');
  if (collectedPanel) collectedPanel.style.display = type === 'batch' ? 'none' : 'flex';
  if (type === 'single') {
    document.getElementById('me-mbr-panel-single').style.display = 'flex';
  } else if (type === 'batch') {
    const b = document.getElementById('me-mbr-panel-batch');
    if (b) b.style.display = 'flex';
  } else {
    document.getElementById('me-mbr-panel-split').style.display = 'flex';
    meMbrCurSplitType = type;
    meMbrLoadLeft(type);
  }
}

// ── 좌측 목록 로드 ──────────────────────────────────────────────────
function meMbrLoadLeft(type) {
  const leftEl = document.getElementById('me-mbr-left-list');
  const guides = {dept:'부서',grade:'직급',position:'직책',job:'직무',jobgroup:'직군',target:'대상구분 유형'};
  document.getElementById('me-mbr-right-empty').style.display = 'flex';
  document.getElementById('me-mbr-right-content').style.display = 'none';
  if (type === 'target') {
    meMbrTargetTypeIdx = null;
    document.getElementById('me-mbr-split-guide').textContent = '좌측에서 대상구분 유형을 선택하세요.';
    leftEl.innerHTML = MBR_TARGET_TYPES.map((t, i) =>
      `<div class="mbr-left-item" onclick="meMbrSelectTargetType(${i})" id="mbr-left-${i}">
        <span>${t.typeName}</span><span class="cnt">${t.divs.length}개 구분</span>
      </div>`
    ).join('');
  } else if (type === 'dept') {
    document.getElementById('me-mbr-split-guide').textContent = '부서를 선택하면 해당 부서 및 하위 부서 인원이 표시됩니다.';
    meMbrUpdateBreadcrumb(null);
    meMbrDeptCollapsed.clear();
    leftEl.innerHTML = meMbrRenderDeptTree(MBR_DEPT_TREE);
  } else {
    const data = MBR_DATA[type] || [];
    meMbrUpdateBreadcrumb(null);
    document.getElementById('me-mbr-split-guide').textContent = `좌측에서 ${guides[type]}를 선택하면 해당 인원이 표시됩니다.`;
    leftEl.innerHTML = data.map((item, i) =>
      `<div class="mbr-left-item" onclick="meMbrSelectLeft(${i},'${type}')" id="mbr-left-${i}">
        <span>${item.label}</span><span class="cnt">${item.members.length}</span>
      </div>`
    ).join('');
  }
}

// ── 대상구분 1단계 선택 ──────────────────────────────────────────────
function meMbrSelectTargetType(typeIdx) {
  document.querySelectorAll('.mbr-left-item').forEach(el => el.classList.remove('selected'));
  document.getElementById('mbr-left-' + typeIdx)?.classList.add('selected');
  meMbrTargetTypeIdx = typeIdx;
  const t = MBR_TARGET_TYPES[typeIdx];
  if (!t) return;
  const leftEl = document.getElementById('me-mbr-left-list');
  leftEl.innerHTML = `
    <div onclick="meMbrLoadLeft('target')" style="display:flex;align-items:center;gap:4px;padding:8px 12px;font-size:11px;color:var(--primary,#3f61ed);cursor:pointer;border-bottom:1px solid var(--border,#e0e3e8);background:#f0f4ff;">
      ← 유형 목록
    </div>
    <div style="padding:6px 12px 4px;font-size:11px;font-weight:700;color:#555;border-bottom:1px solid var(--border,#e0e3e8);">${t.typeName}</div>
    ${t.divs.map((d, i) =>
      `<div class="mbr-left-item" onclick="meMbrSelectTargetDiv(${typeIdx},${i})" id="mbr-tdiv-${typeIdx}-${i}">
        <span>${d.divName}</span><span class="cnt">${d.members.length}</span>
      </div>`
    ).join('')}`;
  document.getElementById('me-mbr-split-guide').textContent = `${t.typeName}의 구분을 선택하면 해당 인원이 표시됩니다.`;
  document.getElementById('me-mbr-right-empty').style.display  = 'flex';
  document.getElementById('me-mbr-right-content').style.display = 'none';
}

// ── 대상구분 2단계 선택 ──────────────────────────────────────────────
function meMbrSelectTargetDiv(typeIdx, divIdx) {
  document.querySelectorAll('.mbr-left-item').forEach(el => el.classList.remove('selected'));
  document.getElementById(`mbr-tdiv-${typeIdx}-${divIdx}`)?.classList.add('selected');
  const t = MBR_TARGET_TYPES[typeIdx];
  const d = t?.divs[divIdx];
  if (!d) return;
  const registered = _meMbrConfig.getRegistered();
  document.getElementById('me-mbr-right-empty').style.display  = 'none';
  document.getElementById('me-mbr-right-content').style.display = 'flex';
  document.getElementById('me-mbr-right-title').textContent = `${t.typeName} > ${d.divName}`;
  document.getElementById('me-mbr-right-cnt').textContent = d.members.length;
  const tbody = document.getElementById('me-mbr-right-tbody');
  tbody.innerHTML = d.members.map(m => {
    const isReg = registered.some(r => r.empno === m.empno);
    return `<tr data-name="${m.name}" data-empno="${m.empno}" data-loginid="${m.loginId||''}" data-company="${m.company||''}" data-dept="${m.dept||''}"${isReg ? ' style="background:#fafafa;"' : ''}>
    <td style="text-align:center;padding:5px 4px;width:34px;">${isReg ? '<span style="font-size:10px;color:#ccc;">등록됨</span>' : '<input type="checkbox" class="me-mbr-r-chk">'}</td>
    <td style="padding:5px 8px;font-weight:600;${isReg ? 'color:#bbb;' : ''}">${_mbr_maskN(m.name)}</td>
    <td style="padding:5px 8px;color:${isReg ? '#ccc' : '#888'};font-size:11px;width:78px;">${_mbr_maskE(m.empno)}</td>
    <td style="padding:5px 8px;color:${isReg ? '#ccc' : '#888'};font-size:11px;">${m.dept||''}</td>
    <td style="text-align:center;padding:3px 4px;width:46px;">${isReg ? '' : '<button class="btn btn-reset" style="height:20px;padding:0 6px;font-size:11px;" onclick="meMbrAddRowToCollected(this)">추가</button>'}</td>
    </tr>`;
  }).join('');
}

// ── 직급/직책/직무/직군 좌측 항목 클릭 ──────────────────────────────
function meMbrSelectLeft(idx, type) {
  document.querySelectorAll('.mbr-left-item').forEach(el => el.classList.remove('selected'));
  document.getElementById('mbr-left-' + idx)?.classList.add('selected');
  const item = (MBR_DATA[type] || [])[idx];
  if (!item) return;
  const registered = _meMbrConfig.getRegistered();
  document.getElementById('me-mbr-right-empty').style.display  = 'none';
  document.getElementById('me-mbr-right-content').style.display = 'flex';
  document.getElementById('me-mbr-right-title').textContent = item.label;
  document.getElementById('me-mbr-right-cnt').textContent = item.members.length;
  const tbody = document.getElementById('me-mbr-right-tbody');
  tbody.innerHTML = item.members.map(m => {
    const isReg = registered.some(r => r.empno === m.empno);
    return `<tr data-name="${m.name}" data-empno="${m.empno}" data-loginid="${m.loginId||''}" data-company="${m.company||''}" data-dept="${m.dept||''}"${isReg ? ' style="background:#fafafa;"' : ''}>
    <td style="text-align:center;padding:5px 4px;width:34px;">${isReg ? '<span style="font-size:10px;color:#ccc;">등록됨</span>' : '<input type="checkbox" class="me-mbr-r-chk">'}</td>
    <td style="padding:5px 8px;font-weight:600;${isReg ? 'color:#bbb;' : ''}">${_mbr_maskN(m.name)}</td>
    <td style="padding:5px 8px;color:${isReg ? '#ccc' : '#888'};font-size:11px;width:78px;">${_mbr_maskE(m.empno)}</td>
    <td style="padding:5px 8px;color:${isReg ? '#ccc' : '#888'};font-size:11px;">${m.dept||''}</td>
    <td style="text-align:center;padding:3px 4px;width:46px;">${isReg ? '' : '<button class="btn btn-reset" style="height:20px;padding:0 6px;font-size:11px;" onclick="meMbrAddRowToCollected(this)">추가</button>'}</td>
    </tr>`;
  }).join('');
}

// ── 개별 탭 ─────────────────────────────────────────────────────────
function meMbrSingleAll() {
  const tbody = document.getElementById('me-mbr-s-tbody');
  if (!tbody) return;
  const registered = _meMbrConfig.getRegistered();
  tbody.innerHTML = ME_SAMPLE_MEMBERS.map(m => {
    const isReg = registered.some(r => r.empno === m.empno);
    return `<tr data-name="${m.name}" data-empno="${m.empno}" data-loginid="${m.loginId||m.empno}" data-company="${m.company}" data-dept="${m.dept}"${isReg ? ' style="background:#fafafa;"' : ''}>
    <td style="text-align:center;padding:5px 4px;">${isReg ? '<span style="font-size:10px;color:#ccc;">등록됨</span>' : '<input type="checkbox" class="me-mbr-s-chk" onchange="meMbrSelCount()">'}</td>
    <td style="padding:5px 6px;font-weight:600;${isReg ? 'color:#bbb;' : ''}">${_mbr_maskN(m.name)}</td>
    <td style="text-align:center;padding:5px 6px;color:${isReg ? '#ccc' : '#666'};font-size:11px;">${_mbr_maskL(m.loginId||m.empno)}</td>
    <td style="text-align:center;padding:5px 6px;color:${isReg ? '#ccc' : '#888'};font-size:11px;">${_mbr_maskE(m.empno)}</td>
    <td style="text-align:center;padding:5px 6px;color:${isReg ? '#ccc' : '#888'};font-size:11px;">${m.company}</td>
    <td style="padding:5px 6px;color:${isReg ? '#ccc' : '#888'};font-size:11px;">${m.dept}</td>
    <td style="text-align:center;padding:3px 4px;">${isReg ? '' : '<button class="btn btn-reset" style="height:20px;padding:0 6px;font-size:11px;" onclick="meMbrAddSingleRowToCollected(this)">추가</button>'}</td>
    </tr>`;
  }).join('');
  document.getElementById('me-mbr-s-total').textContent = ME_SAMPLE_MEMBERS.length;
  meMbrSelCount();
}
function meMbrSingleSearch() {
  const kw = document.getElementById('me-mbr-s-kw')?.value.trim();
  if (!kw) { meMbrSingleAll(); return; }
  const registered = _meMbrConfig.getRegistered();
  const filtered = ME_SAMPLE_MEMBERS.filter(m =>
    m.name.includes(kw) || m.empno.includes(kw) || m.dept.includes(kw) || (m.loginId||'').includes(kw)
  );
  const tbody = document.getElementById('me-mbr-s-tbody');
  tbody.innerHTML = filtered.length
    ? filtered.map(m => {
        const isReg = registered.some(r => r.empno === m.empno);
        return `<tr data-name="${m.name}" data-empno="${m.empno}" data-loginid="${m.loginId||m.empno}" data-company="${m.company}" data-dept="${m.dept}"${isReg ? ' style="background:#fafafa;"' : ''}>
        <td style="text-align:center;padding:5px 4px;">${isReg ? '<span style="font-size:10px;color:#ccc;">등록됨</span>' : '<input type="checkbox" class="me-mbr-s-chk" onchange="meMbrSelCount()">'}</td>
        <td style="padding:5px 6px;font-weight:600;${isReg ? 'color:#bbb;' : ''}">${_mbr_maskN(m.name)}</td>
        <td style="text-align:center;padding:5px 6px;color:${isReg ? '#ccc' : '#666'};font-size:11px;">${_mbr_maskL(m.loginId||m.empno)}</td>
        <td style="text-align:center;padding:5px 6px;color:${isReg ? '#ccc' : '#888'};font-size:11px;">${_mbr_maskE(m.empno)}</td>
        <td style="text-align:center;padding:5px 6px;color:${isReg ? '#ccc' : '#888'};font-size:11px;">${m.company}</td>
        <td style="padding:5px 6px;color:${isReg ? '#ccc' : '#888'};font-size:11px;">${m.dept}</td>
        <td style="text-align:center;padding:3px 4px;">${isReg ? '' : '<button class="btn btn-reset" style="height:20px;padding:0 6px;font-size:11px;" onclick="meMbrAddSingleRowToCollected(this)">추가</button>'}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="7" style="text-align:center;padding:20px;color:#aaa;">검색 결과가 없습니다.</td></tr>';
  document.getElementById('me-mbr-s-total').textContent = filtered.length;
  meMbrSelCount();
}
function meMbrSelCount() {
  document.getElementById('me-mbr-s-sel').textContent = document.querySelectorAll('.me-mbr-s-chk:checked').length;
}
function meMbrSingleAddChecked() {
  const checked = [...document.querySelectorAll('.me-mbr-s-chk:checked')];
  if (!checked.length) { alert('추가할 인원을 선택해주세요.'); return; }
  checked.forEach(chk => {
    const row = chk.closest('tr');
    const name = row.dataset.name, empno = row.dataset.empno, loginId = row.dataset.loginid, company = row.dataset.company, dept = row.dataset.dept;
    if (name && empno && !ME_COLLECTED.find(m => m.empno === empno)) ME_COLLECTED.push({name, loginId, company, empno, dept});
  });
  meMbrUpdateCollected();
}

// ── 최종 등록 ───────────────────────────────────────────────────────
function meMbrFinalReg() {
  if (!ME_COLLECTED.length) { alert('등록할 인원을 추가해주세요.'); return; }
  if (_meMbrConfig.onRegister) {
    _meMbrConfig.onRegister([...ME_COLLECTED]);
  }
  ME_COLLECTED.length = 0;
  document.getElementById('me-member-modal').style.display = 'none';
}

// ── 팝업 열기 ───────────────────────────────────────────────────────
function meOpenMemberSingleModal() {
  ME_COLLECTED.length = 0;
  meMbrUpdateCollected();
  const sel = document.getElementById('me-mbr-s-company');
  if (sel) {
    const companies = _meMbrConfig.getCompanies();
    sel.innerHTML = companies.map((c, i) => `<option value="${i === 0 ? '' : c}">${c}</option>`).join('');
  }
  meMbrTab('single', document.querySelector('.mbr-tab'));
  meMbrSingleAll();
  document.getElementById('me-member-modal').style.display = 'flex';
}
function meOpenMemberBatchModal() {
  meMbrTab('batch', document.querySelectorAll('.mbr-tab')[7]);
  document.getElementById('me-member-modal').style.display = 'flex';
}

// ── 일괄등록 ────────────────────────────────────────────────────────
let _meMbrBatchFile      = null;
let _meMbrBatchPreviewed = false;
let _meMbrBatchHasError  = false;

function meMbrBatchSetFile(file) {
  if (!file) return;
  _meMbrBatchFile = file;
  _meMbrBatchPreviewed = false;
  _meMbrBatchHasError  = false;
  _meMbrBatchSetRegBtn(false);
  document.getElementById('me-mbr-batch-preview-result').style.display = 'none';
  const dz = document.getElementById('me-mbr-batch-dropzone');
  if (dz) dz.style.display = 'none';
  const nm = document.getElementById('me-mbr-batch-fname');
  nm.style.display = 'block';
  nm.innerHTML = `📎 <strong>${file.name}</strong> <span style="color:#aaa;font-size:11px;">(${(file.size/1024).toFixed(1)}KB)</span>
    <button onclick="meMbrBatchRemoveFile()" style="margin-left:8px;background:none;border:none;color:#e53935;cursor:pointer;font-size:11px;">✕ 삭제</button>`;
}
function meMbrBatchRemoveFile() {
  _meMbrBatchFile = null; _meMbrBatchPreviewed = false; _meMbrBatchHasError = false;
  _meMbrBatchSetRegBtn(false);
  document.getElementById('me-mbr-batch-file').value = '';
  document.getElementById('me-mbr-batch-fname').style.display = 'none';
  const dz = document.getElementById('me-mbr-batch-dropzone');
  if (dz) dz.style.display = 'block';
  document.getElementById('me-mbr-batch-preview-result').style.display = 'none';
}
function _meMbrBatchSetRegBtn(enabled) {
  const btn = document.getElementById('me-mbr-batch-regist-btn');
  if (!btn) return;
  btn.style.opacity  = enabled ? '1' : '0.4';
  btn.style.cursor   = enabled ? 'pointer' : 'not-allowed';
  btn.dataset.active = enabled ? 'true' : 'false';
}
function meMbrBatchPreview() {
  if (!_meMbrBatchFile) { alert('엑셀파일을 등록해주세요.'); return; }
  const ext = _meMbrBatchFile.name.split('.').pop().toLowerCase();
  if (!['xlsx', 'xls'].includes(ext)) { alert('엑셀파일(.xlsx, .xls)을 등록해주세요.'); return; }
  _meMbrBatchPreviewed = true;
  _meMbrBatchHasError  = true;
  const result = document.getElementById('me-mbr-batch-preview-result');
  const tbody  = document.getElementById('me-mbr-batch-preview-tbody');
  const errBtn = document.getElementById('me-mbr-batch-error-down');
  result.style.display = 'block';
  errBtn.style.display = 'inline-block';
  tbody.innerHTML = `
    <tr style="background:#fff8f8;">
      <td style="padding:7px 12px;color:#e53935;font-size:11px;">ho*****01</td>
      <td style="padding:7px 12px;font-size:11px;color:#555;">이미 등록된 아이디</td>
    </tr>
    <tr>
      <td style="padding:7px 12px;color:#e53935;font-size:11px;"></td>
      <td style="padding:7px 12px;font-size:11px;color:#555;">아이디 미입력 (3행)</td>
    </tr>`;
  _meMbrBatchSetRegBtn(false);
  alert('파일에 오류가 발견되었습니다. 오류내용을 확인하시고 파일을 수정 후 다시 미리보기 해주세요.');
}
function meMbrBatchRegist() {
  const btn = document.getElementById('me-mbr-batch-regist-btn');
  if (!btn || btn.dataset.active !== 'true') {
    if (!_meMbrBatchFile)        alert('엑셀파일을 등록해주세요.');
    else if (!_meMbrBatchPreviewed) alert('먼저 미리보기를 해주세요.');
    else if (_meMbrBatchHasError)   alert('미리보기에 오류사항이 있습니다. 오류내용을 확인하시고 다시 미리보기 해주세요.');
    return;
  }
  alert('일괄 등록되었습니다.');
  document.getElementById('me-member-modal').style.display = 'none';
  meMbrBatchRemoveFile();
}
