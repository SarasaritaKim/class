// app.js

// --- State Management ---
let state = {
  rosters: {}, // { rosterName: [studentNames] }
  currentRosterName: 'new',
  rows: 5,
  cols: 6,
  gridData: [], // Array of { index, status: 'empty'|'occupied'|'fixed'|'blocked', studentName }
  isAnimating: false
};

// --- Constant Presets ---
const DEFAULT_ROSTER_NAME = '★ 예시 학급 명단 (20명)';
const DEFAULT_STUDENTS = [
  '강태양', '김민준', '이서연', '박예은', '최정우', 
  '정다은', '임도현', '한지민', '오진우', '윤지아', 
  '서준우', '신예원', '황민우', '송하은', '배진아', 
  '조성민', '백지우', '유현우', '남주희', '전은우'
];

// --- DOM Elements ---
const themeToggleBtn = document.getElementById('theme-toggle');
const printBtn = document.getElementById('btn-print');
const rosterSelect = document.getElementById('roster-select');
const deleteRosterBtn = document.getElementById('btn-delete-roster');
const studentInput = document.getElementById('student-input');
const rosterNameInput = document.getElementById('roster-name');
const saveRosterBtn = document.getElementById('btn-save-roster');
const rowsInput = document.getElementById('rows-input');
const colsInput = document.getElementById('cols-input');
const btnInstantShuffle = document.getElementById('btn-instant-shuffle');
const btnRouletteShuffle = document.getElementById('btn-roulette-shuffle');
const btnResetGrid = document.getElementById('btn-reset-grid');
const classroomGrid = document.getElementById('classroom-grid');
const rouletteOverlay = document.getElementById('roulette-overlay');
const rouletteName = document.getElementById('roulette-name');
const rouletteSeatDesc = document.getElementById('roulette-seat-desc');

// Stat Elements
const statTotalSeats = document.getElementById('stat-total-seats');
const statStudents = document.getElementById('stat-students');
const statAvailable = document.getElementById('stat-available');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  loadRostersFromStorage();
  initGridData();
  renderGrid();
  updateStats();
  
  // Event Listeners
  themeToggleBtn.addEventListener('click', toggleTheme);
  printBtn.addEventListener('click', () => window.print());
  rosterSelect.addEventListener('change', handleRosterSelection);
  saveRosterBtn.addEventListener('click', saveCurrentRoster);
  deleteRosterBtn.addEventListener('click', deleteCurrentRoster);
  rowsInput.addEventListener('change', handleGridDimensionChange);
  colsInput.addEventListener('change', handleGridDimensionChange);
  btnInstantShuffle.addEventListener('click', runInstantShuffle);
  btnRouletteShuffle.addEventListener('click', runRouletteShuffle);
  btnResetGrid.addEventListener('click', resetGridStructure);
  studentInput.addEventListener('input', updateStats);
});

// --- Theme Management ---
function loadTheme() {
  const savedTheme = localStorage.getItem('smart_seat_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcons(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('smart_seat_theme', newTheme);
  updateThemeIcons(newTheme);
}

function updateThemeIcons(theme) {
  // Theme state is handled by CSS display rules on Lucide icons in index.html
}

// --- LocalStorage & Roster Management ---
function loadRostersFromStorage() {
  const stored = localStorage.getItem('smart_seat_rosters');
  if (stored) {
    state.rosters = JSON.parse(stored);
  } else {
    // Inject default preset
    state.rosters[DEFAULT_ROSTER_NAME] = DEFAULT_STUDENTS;
    localStorage.setItem('smart_seat_rosters', JSON.stringify(state.rosters));
  }
  populateRosterDropdown();
}

function populateRosterDropdown() {
  // Clear options except "new"
  rosterSelect.innerHTML = '<option value="new">새로운 명단 작성...</option>';
  
  Object.keys(state.rosters).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    rosterSelect.appendChild(option);
  });

  // Select first preset if available
  if (Object.keys(state.rosters).length > 0) {
    const firstPreset = Object.keys(state.rosters).includes(DEFAULT_ROSTER_NAME) 
      ? DEFAULT_ROSTER_NAME 
      : Object.keys(state.rosters)[0];
    rosterSelect.value = firstPreset;
    loadRosterToTextarea(firstPreset);
  }
}

function loadRosterToTextarea(name) {
  if (state.rosters[name]) {
    studentInput.value = state.rosters[name].join('\n');
    rosterNameInput.value = name === DEFAULT_ROSTER_NAME ? '' : name;
    state.currentRosterName = name;
    updateStats();
  }
}

function handleRosterSelection(e) {
  const val = e.target.value;
  if (val === 'new') {
    studentInput.value = '';
    rosterNameInput.value = '';
    state.currentRosterName = 'new';
    resetGridStructure();
    showToast('새 명단 작성을 시작합니다.');
  } else {
    loadRosterToTextarea(val);
    resetGridStructure();
    showToast(`'${val}' 명단을 불러왔습니다.`);
  }
  updateStats();
}

function saveCurrentRoster() {
  const name = rosterNameInput.value.trim();
  const namesText = studentInput.value;
  const namesArray = namesText.split('\n').map(n => n.trim()).filter(n => n !== '');

  if (!name) {
    showToast('명단 이름을 입력해주세요!', 3000);
    return;
  }
  if (namesArray.length === 0) {
    showToast('학생 이름을 입력해주세요!', 3000);
    return;
  }

  state.rosters[name] = namesArray;
  localStorage.setItem('smart_seat_rosters', JSON.stringify(state.rosters));
  populateRosterDropdown();
  rosterSelect.value = name;
  state.currentRosterName = name;
  showToast(`'${name}' 명단이 저장되었습니다.`);
}

function deleteCurrentRoster() {
  const selected = rosterSelect.value;
  if (selected === 'new') {
    showToast('삭제할 명단이 선택되지 않았습니다.');
    return;
  }
  if (selected === DEFAULT_ROSTER_NAME) {
    showToast('기본 예시 명단은 삭제할 수 없습니다.');
    return;
  }

  if (confirm(`'${selected}' 명단을 삭제하시겠습니까?`)) {
    delete state.rosters[selected];
    localStorage.setItem('smart_seat_rosters', JSON.stringify(state.rosters));
    populateRosterDropdown();
    rosterSelect.value = 'new';
    studentInput.value = '';
    rosterNameInput.value = '';
    state.currentRosterName = 'new';
    resetGridStructure();
    showToast('명단이 삭제되었습니다.');
  }
}

// --- Grid Logic & Rendering ---
function initGridData() {
  state.rows = parseInt(rowsInput.value) || 5;
  state.cols = parseInt(colsInput.value) || 6;
  
  const totalCells = state.rows * state.cols;
  state.gridData = Array.from({ length: totalCells }, (_, i) => ({
    index: i,
    status: 'empty',
    studentName: ''
  }));
}

function handleGridDimensionChange() {
  if (state.isAnimating) return;
  const prevData = [...state.gridData];
  initGridData();
  
  // Try to preserve previous seat statuses (fixed, blocked) for overlapping indices
  const minLength = Math.min(prevData.length, state.gridData.length);
  for (let i = 0; i < minLength; i++) {
    state.gridData[i].status = prevData[i].status;
    state.gridData[i].studentName = prevData[i].studentName;
  }
  
  renderGrid();
  updateStats();
}

function resetGridStructure() {
  if (state.isAnimating) return;
  initGridData();
  renderGrid();
  updateStats();
  showToast('자리가 초기화되었습니다.');
}

function renderGrid() {
  classroomGrid.innerHTML = '';
  classroomGrid.style.gridTemplateColumns = `repeat(${state.cols}, 1fr)`;
  
  state.gridData.forEach(cell => {
    const seat = document.createElement('div');
    seat.className = `seat-box ${cell.status}`;
    seat.setAttribute('data-index', cell.index);
    
    // Enable HTML5 Drag & Drop only if occupied or fixed
    if (cell.status === 'occupied' || cell.status === 'fixed') {
      seat.setAttribute('draggable', 'true');
    }

    // Seat index number
    const indexSpan = document.createElement('span');
    indexSpan.className = 'seat-index';
    
    // Create icons based on status
    let iconsHtml = '';
    if (cell.status === 'fixed') {
      iconsHtml = ' <i data-lucide="pin" style="width: 10px; height: 10px; vertical-align: middle; color: white;"></i>';
    } else if (cell.status === 'blocked') {
      iconsHtml = ' <i data-lucide="ban" style="width: 10px; height: 10px; vertical-align: middle;"></i>';
    }
    indexSpan.innerHTML = `${cell.index + 1}${iconsHtml}`;
    seat.appendChild(indexSpan);

    // Seat Name Content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'seat-content';
    if (cell.status === 'blocked') {
      contentDiv.textContent = '통로';
    } else if (cell.status === 'empty') {
      contentDiv.textContent = '빈자리';
    } else {
      contentDiv.textContent = cell.studentName;
    }
    seat.appendChild(contentDiv);

    // Seat Actions (Hover controls)
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'seat-actions';
    
    // Pin / Lock Button
    const pinBtn = document.createElement('button');
    pinBtn.className = 'seat-action-btn pin-btn';
    pinBtn.title = cell.status === 'fixed' ? '고정 해제' : '자리 고정';
    pinBtn.innerHTML = `<i data-lucide="${cell.status === 'fixed' ? 'pin-off' : 'pin'}" style="width: 12px; height: 12px;"></i>`;
    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePinSeat(cell.index);
    });
    
    // Block / Corridor Button
    const blockBtn = document.createElement('button');
    blockBtn.className = 'seat-action-btn block-btn';
    blockBtn.title = cell.status === 'blocked' ? '통로 해제' : '통로/장애물 지정';
    blockBtn.innerHTML = `<i data-lucide="${cell.status === 'blocked' ? 'unlock' : 'ban'}" style="width: 12px; height: 12px;"></i>`;
    blockBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBlockSeat(cell.index);
    });

    actionsDiv.appendChild(pinBtn);
    actionsDiv.appendChild(blockBtn);
    seat.appendChild(actionsDiv);

    // Grid Cell Click: Toggle normal seat ↔ blocked seat directly (except when occupied)
    seat.addEventListener('click', () => {
      if (cell.status === 'empty' || cell.status === 'blocked') {
        toggleBlockSeat(cell.index);
      }
    });

    // Drag and Drop Event Listeners
    setupDragAndDropEvents(seat, cell.index);

    classroomGrid.appendChild(seat);
  });

  // Re-run Lucide creation to style newly added icons
  lucide.createIcons();
}

function togglePinSeat(index) {
  if (state.isAnimating) return;
  const cell = state.gridData[index];
  if (cell.status === 'empty' || cell.status === 'blocked') {
    showToast('비어 있거나 통로인 좌석은 고정할 수 없습니다.');
    return;
  }
  
  if (cell.status === 'occupied') {
    cell.status = 'fixed';
    showToast(`'${cell.studentName}' 학생의 자리를 고정했습니다.`);
  } else if (cell.status === 'fixed') {
    cell.status = 'occupied';
    showToast(`'${cell.studentName}' 학생의 자리 고정을 해제했습니다.`);
  }
  
  renderGrid();
}

function toggleBlockSeat(index) {
  if (state.isAnimating) return;
  const cell = state.gridData[index];
  
  if (cell.status === 'blocked') {
    cell.status = 'empty';
    cell.studentName = '';
  } else {
    // If it was occupied or fixed, warn or remove student name
    if (cell.studentName) {
      showToast(`'${cell.studentName}' 학생 배정이 취소되고 통로로 지정되었습니다.`);
    }
    cell.status = 'blocked';
    cell.studentName = '';
  }
  
  renderGrid();
  updateStats();
}

// --- Drag & Drop Swap Implementation ---
let draggedIndex = null;

function setupDragAndDropEvents(element, index) {
  element.addEventListener('dragstart', (e) => {
    if (state.isAnimating) {
      e.preventDefault();
      return;
    }
    const cell = state.gridData[index];
    if (cell.status !== 'occupied' && cell.status !== 'fixed') {
      e.preventDefault();
      return;
    }
    draggedIndex = index;
    element.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  });

  element.addEventListener('dragend', () => {
    element.classList.remove('dragging');
    draggedIndex = null;
    // Clear all drop highlights
    document.querySelectorAll('.seat-box').forEach(el => el.classList.remove('drag-over'));
  });

  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    const cell = state.gridData[index];
    if (cell.status === 'blocked') return; // Cannot swap into a blocked seat
    e.dataTransfer.dropEffect = 'move';
  });

  element.addEventListener('dragenter', (e) => {
    e.preventDefault();
    const cell = state.gridData[index];
    if (cell.status === 'blocked') return;
    if (index !== draggedIndex) {
      element.classList.add('drag-over');
    }
  });

  element.addEventListener('dragleave', () => {
    element.classList.remove('drag-over');
  });

  element.addEventListener('drop', (e) => {
    e.preventDefault();
    element.classList.remove('drag-over');
    
    const sourceIdx = parseInt(e.dataTransfer.getData('text/plain'));
    const targetIdx = index;

    if (isNaN(sourceIdx) || sourceIdx === targetIdx) return;
    
    const sourceCell = state.gridData[sourceIdx];
    const targetCell = state.gridData[targetIdx];
    
    if (targetCell.status === 'blocked') {
      showToast('통로와는 자리를 바꿀 수 없습니다.');
      return;
    }

    // Swap data
    const tempName = sourceCell.studentName;
    const tempStatus = sourceCell.status;
    
    sourceCell.studentName = targetCell.studentName;
    sourceCell.status = targetCell.status === 'empty' ? 'empty' : targetCell.status;
    if (sourceCell.studentName === '') {
      sourceCell.status = 'empty';
    }

    targetCell.studentName = tempName;
    targetCell.status = tempStatus === 'empty' ? 'empty' : tempStatus;
    if (targetCell.studentName === '') {
      targetCell.status = 'empty';
    }
    
    renderGrid();
    updateStats();
    showToast('자리를 교환했습니다.');
  });
}

// --- Stats Management ---
function updateStats() {
  const namesText = studentInput.value;
  const namesArray = namesText.split('\n').map(n => n.trim()).filter(n => n !== '');
  
  const totalSeats = state.rows * state.cols;
  const blockedCount = state.gridData.filter(c => c.status === 'blocked').length;
  const activeSeatsCount = totalSeats - blockedCount;
  
  // Count current placed students
  const placedCount = state.gridData.filter(c => c.status === 'occupied' || c.status === 'fixed').length;

  statTotalSeats.textContent = activeSeatsCount;
  statStudents.textContent = namesArray.length;
  
  const available = activeSeatsCount - namesArray.length;
  statAvailable.textContent = available >= 0 ? available : 0;
  
  if (available < 0) {
    statAvailable.style.color = 'var(--secondary)';
  } else {
    statAvailable.style.color = 'var(--primary)';
  }
}

// --- Shuffle Algorithms ---

// Fisher-Yates shuffle helper
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getStudentsFromTextarea() {
  return studentInput.value.split('\n').map(n => n.trim()).filter(n => n !== '');
}

function runInstantShuffle() {
  if (state.isAnimating) return;
  
  const allStudents = getStudentsFromTextarea();
  if (allStudents.length === 0) {
    showToast('배치할 학생 이름을 먼저 입력해주세요!');
    return;
  }

  // 1. Scan the grid to find fixed students
  const fixedStudents = [];
  const fixedIndices = new Set();
  const blockedIndices = new Set();

  state.gridData.forEach(cell => {
    if (cell.status === 'fixed') {
      fixedStudents.push(cell.studentName);
      fixedIndices.add(cell.index);
    } else if (cell.status === 'blocked') {
      blockedIndices.add(cell.index);
    }
  });

  // Verify fixed students are still in the textarea list.
  // If a fixed student is no longer in the list, release the cell to 'empty'
  fixedIndices.forEach(idx => {
    const name = state.gridData[idx].studentName;
    if (!allStudents.includes(name)) {
      state.gridData[idx].status = 'empty';
      state.gridData[idx].studentName = '';
      fixedIndices.delete(idx);
    }
  });

  // 2. Filter out fixed students from the list to get "unassigned students"
  const unassignedStudents = allStudents.filter(name => {
    // Allow duplicate names, but match count
    const fixedCount = state.gridData.filter(c => c.status === 'fixed' && c.studentName === name).length;
    const totalInputCount = allStudents.filter(n => n === name).length;
    // If we have more inputs than fixed spots, keep the remaining in unassigned
    const assignedCount = state.gridData.filter(c => c.status === 'fixed' && c.studentName === name && fixedIndices.has(c.index)).length;
    // simple check: if name is in fixedIndices names, reduce count
    return !state.gridData.some(c => c.status === 'fixed' && c.index === state.gridData.findIndex(f => f.studentName === name && fixedIndices.has(f.index)));
  });
  
  // Let's do a robust filter:
  const rosterCounts = {};
  allStudents.forEach(n => rosterCounts[n] = (rosterCounts[n] || 0) + 1);
  fixedIndices.forEach(idx => {
    const name = state.gridData[idx].studentName;
    if (rosterCounts[name]) rosterCounts[name]--;
  });
  
  const finalUnassigned = [];
  Object.keys(rosterCounts).forEach(name => {
    for (let k = 0; k < rosterCounts[name]; k++) {
      finalUnassigned.push(name);
    }
  });

  // 3. Find eligible empty seats
  const eligibleIndices = state.gridData
    .filter(cell => cell.status !== 'blocked' && cell.status !== 'fixed')
    .map(cell => cell.index);

  if (finalUnassigned.length > eligibleIndices.length) {
    showToast(`자리가 부족합니다! 학생은 ${allStudents.length}명인데 앉을 수 있는 좌석은 ${eligibleIndices.length + fixedIndices.size}개입니다.`, 4000);
    return;
  }

  // Shuffle the unassigned students
  const shuffledUnassigned = shuffleArray([...finalUnassigned]);

  // Create snap-shot array to apply animations to modified cells
  const animatedIndices = [];

  // Assign to eligible seats
  eligibleIndices.forEach((cellIdx, i) => {
    const cell = state.gridData[cellIdx];
    const prevName = cell.studentName;
    
    if (i < shuffledUnassigned.length) {
      cell.studentName = shuffledUnassigned[i];
      cell.status = 'occupied';
      if (prevName !== cell.studentName) {
        animatedIndices.push(cellIdx);
      }
    } else {
      cell.studentName = '';
      cell.status = 'empty';
    }
  });

  renderGrid();
  updateStats();
  
  // Apply card flip animations for placed seats
  animatedIndices.forEach(idx => {
    const element = document.querySelector(`.seat-box[data-index="${idx}"]`);
    if (element) {
      element.classList.add('seat-flip');
      element.addEventListener('animationend', () => {
        element.classList.remove('seat-flip');
      }, { once: true });
    }
  });

  showToast('모든 자리가 즉시 배치되었습니다! 🎉');
}

// --- Roulette (Sequential) Shuffle ---
function runRouletteShuffle() {
  if (state.isAnimating) return;

  const allStudents = getStudentsFromTextarea();
  if (allStudents.length === 0) {
    showToast('배치할 학생 이름을 먼저 입력해주세요!');
    return;
  }

  // 1. Scan grid details
  const fixedIndices = new Set();
  const blockedIndices = new Set();
  
  state.gridData.forEach(cell => {
    if (cell.status === 'fixed') {
      fixedIndices.add(cell.index);
    } else if (cell.status === 'blocked') {
      blockedIndices.add(cell.index);
    }
  });

  // Verify fixed students are still in input
  fixedIndices.forEach(idx => {
    const name = state.gridData[idx].studentName;
    if (!allStudents.includes(name)) {
      state.gridData[idx].status = 'empty';
      state.gridData[idx].studentName = '';
      fixedIndices.delete(idx);
    }
  });

  // 2. Filter unassigned students
  const rosterCounts = {};
  allStudents.forEach(n => rosterCounts[n] = (rosterCounts[n] || 0) + 1);
  fixedIndices.forEach(idx => {
    const name = state.gridData[idx].studentName;
    if (rosterCounts[name]) rosterCounts[name]--;
  });
  
  const finalUnassigned = [];
  Object.keys(rosterCounts).forEach(name => {
    for (let k = 0; k < rosterCounts[name]; k++) {
      finalUnassigned.push(name);
    }
  });

  const eligibleIndices = state.gridData
    .filter(cell => cell.status !== 'blocked' && cell.status !== 'fixed')
    .map(cell => cell.index);

  if (finalUnassigned.length > eligibleIndices.length) {
    showToast(`자리가 부족합니다! 학생은 ${allStudents.length}명인데 앉을 수 있는 좌석은 ${eligibleIndices.length + fixedIndices.size}개입니다.`, 4000);
    return;
  }

  // Shuffle the student names and seats order so it feels completely random
  const shuffledStudents = shuffleArray([...finalUnassigned]);
  const shuffledSeats = shuffleArray([...eligibleIndices]);

  // Clean the target seats first so they look empty before roulette
  eligibleIndices.forEach(idx => {
    state.gridData[idx].studentName = '';
    state.gridData[idx].status = 'empty';
  });
  renderGrid();

  // Enter animating mode
  state.isAnimating = true;
  rouletteOverlay.classList.add('show');
  
  let studentIdx = 0;

  function processNextStudent() {
    if (studentIdx >= shuffledStudents.length) {
      // Roulette complete!
      state.isAnimating = false;
      rouletteOverlay.classList.remove('show');
      showToast('모든 학생의 룰렛 배정이 완료되었습니다! 🎈');
      renderGrid();
      updateStats();
      return;
    }

    const currentStudent = shuffledStudents[studentIdx];
    const targetSeatIdx = shuffledSeats[studentIdx];
    
    // Animate local name roll in modal overlay
    let rollCounter = 0;
    const maxRolls = 12;
    const rollIntervalMs = 70;

    const rollTimer = setInterval(() => {
      // Roll random names from the list
      const randomIdx = Math.floor(Math.random() * allStudents.length);
      rouletteName.textContent = allStudents[randomIdx];
      rouletteSeatDesc.textContent = `배정 좌석 번호: ${targetSeatIdx + 1}번 자리`;
      
      rollCounter++;
      if (rollCounter >= maxRolls) {
        clearInterval(rollTimer);
        
        // Lock in the final student name in the overlay
        rouletteName.textContent = currentStudent;
        
        // Assign student to the actual grid data
        const cell = state.gridData[targetSeatIdx];
        cell.studentName = currentStudent;
        cell.status = 'occupied';
        
        // Visual indicator in background grid
        renderGrid();
        const seatBoxEl = document.querySelector(`.seat-box[data-index="${targetSeatIdx}"]`);
        if (seatBoxEl) {
          seatBoxEl.classList.add('roulette-active');
        }

        // Wait a brief moment before moving to the next student
        setTimeout(() => {
          if (seatBoxEl) {
            seatBoxEl.classList.remove('roulette-active');
            seatBoxEl.classList.add('seat-flip');
          }
          studentIdx++;
          processNextStudent();
        }, 600);
      }
    }, rollIntervalMs);
  }

  // Start sequential roulette
  processNextStudent();
}

// --- Toast System ---
function showToast(message, duration = 2500) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  
  toastMsg.textContent = message;
  toast.classList.add('show');
  
  // Clear previous timers if any
  if (toast.timeoutId) {
    clearTimeout(toast.timeoutId);
  }
  
  toast.timeoutId = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}
