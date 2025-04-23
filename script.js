document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소
    const sudokuInput = document.getElementById('sudoku-input');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const autoBtn = document.getElementById('auto-btn');
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    const sudokuBoard = document.getElementById('sudoku-board');
    const currentStepElem = document.getElementById('current-step');
    const currentActionElem = document.getElementById('current-action');
    const currentPositionElem = document.getElementById('current-position');
    const testingValueElem = document.getElementById('testing-value');
    const resultElem = document.getElementById('result');
    const sampleBtns = document.querySelectorAll('.sample-btn');
    const addSampleBtn = document.getElementById('add-sample-btn');
    const sampleSection = document.querySelector('.sample-section');

    // 상태 변수
    let board = Array(9).fill().map(() => Array(9).fill(0));
    let initialBoard = Array(9).fill().map(() => Array(9).fill(0));
    let steps = [];
    let currentStepIndex = -1;
    let autoPlayInterval = null;
    let autoPlaySpeed = 500;
    let simulationStarted = false;
    let selectedCell = null; // 현재 선택된 셀
    let autoRunSimulation = false; // 자동으로 시뮬레이션 실행 여부
    let stepCount = 0; // 실제 진행 단계 카운트
    let selectedSampleForDeletion = null;

    // 전역 변수 추가
    let progressStartTime = 0;
    let progressPercent = 0;

    // 시작 상태 설정
    setInitialState();
    
    // 저장된 사용자 정의 샘플 로드
    loadCustomSamples();

    // 이벤트 리스너 설정
    document.addEventListener('keydown', handleKeyPress); // 키보드 이벤트 추가
    startBtn.addEventListener('click', startSimulation);
    resetBtn.addEventListener('click', resetSimulation);
    prevBtn.addEventListener('click', showPreviousStep);
    nextBtn.addEventListener('click', showNextStep);
    autoBtn.addEventListener('click', toggleAutoPlay);
    speedSlider.addEventListener('input', updateSpeed);
    addSampleBtn.addEventListener('click', addCurrentBoardAsSample);
    
    // 샘플 삭제 버튼 이벤트 리스너 추가
    const deleteBtn = document.getElementById('delete-sample-btn');
    if (deleteBtn) {
        deleteBtn.disabled = true; // 초기에는 비활성화
        deleteBtn.addEventListener('click', () => {
            const targetId = deleteBtn.getAttribute('data-target');
            if (targetId) {
                deleteSample(targetId);
                deleteBtn.disabled = true;
                deleteBtn.textContent = '샘플 삭제';
            }
        });
    }
    
    // 자동 시뮬레이션 실행 비활성화
    autoRunSimulation = false;
    
    // 샘플 버튼 이벤트 리스너
    function setupSampleButtonListeners() {
        document.querySelectorAll('.sample-btn').forEach(btn => {
            if (btn.id !== 'add-sample-btn' && btn.id !== 'delete-sample-btn' && !btn.hasAttribute('data-listener-attached')) {
                btn.setAttribute('data-listener-attached', 'true');
                btn.addEventListener('click', () => {
                    // 시뮬레이션이 실행 중이면 초기화
                    if (simulationStarted) {
                        resetSimulation();
                    }
                    
                    sudokuInput.value = btn.dataset.sample;
                    updateBoardFromInput();
                    
                    // 사용자 정의 샘플인 경우 삭제 버튼 활성화
                    if (btn.hasAttribute('data-custom')) {
                        selectedSampleForDeletion = btn.id;
                        const deleteBtn = document.getElementById('delete-sample-btn');
                        if (deleteBtn) {
                            deleteBtn.disabled = false;
                            deleteBtn.setAttribute('data-target', btn.id);
                            deleteBtn.textContent = `"${btn.textContent}" 삭제`;
                        }
                    } else {
                        // 기본 샘플이면 삭제 버튼 비활성화
                        const deleteBtn = document.getElementById('delete-sample-btn');
                        if (deleteBtn) {
                            deleteBtn.disabled = true;
                            deleteBtn.textContent = '샘플 삭제';
                        }
                    }
                });
            }
        });
    }
    
    // 초기 샘플 버튼 설정
    setupSampleButtonListeners();
    
    // 샘플 버튼 추가 함수
    function addSampleButton(id, boardText, name, isCustom = false) {
        const newBtn = document.createElement('button');
        newBtn.className = 'sample-btn';
        newBtn.textContent = name;
        newBtn.dataset.sample = boardText;
        
        if (isCustom) {
            newBtn.dataset.custom = 'true';
            newBtn.id = id;
            
            // 사용자 정의 샘플 그룹에 추가
            const customSamplesGroup = document.getElementById('custom-samples');
            if (customSamplesGroup) {
                customSamplesGroup.appendChild(newBtn);
            } else {
                // 예외 처리: 그룹이 없는 경우 섹션에 직접 추가
                sampleSection.appendChild(newBtn);
            }
        } else {
            // 기본 샘플 그룹에 추가
            const predefinedSamplesGroup = document.getElementById('predefined-samples');
            if (predefinedSamplesGroup) {
                predefinedSamplesGroup.appendChild(newBtn);
            } else {
                // 예외 처리: 그룹이 없는 경우 섹션에 직접 추가
                sampleSection.appendChild(newBtn);
            }
        }
        
        // 이벤트 리스너 다시 설정
        setupSampleButtonListeners();
    }
    
    // 현재 보드를 샘플로 추가
    function addCurrentBoardAsSample() {
        // 현재 보드가 비어있는 경우 0으로 채워진 보드 생성
        if (isEmptyBoard()) {
            fillEmptyBoardWithZeros();
        }
        
        // 현재 보드 상태 가져오기
        const boardText = generateBoardText();
        
        // 고유 ID 생성
        const sampleId = 'custom-' + Date.now();
        
        // 샘플 이름 입력받기
        const sampleName = prompt('새 샘플의 이름을 입력하세요:', '내 샘플 ' + (getCustomSamplesCount() + 1));
        if (!sampleName) return; // 취소하면 종료
        
        // 새 샘플 버튼 추가
        addSampleButton(sampleId, boardText, sampleName, true);
        
        // 로컬 스토리지에 저장
        saveCustomSample(sampleId, boardText, sampleName);
        
        alert('새 샘플이 저장되었습니다!');
    }
    
    // 보드가 비어있는지 확인
    function isEmptyBoard() {
        // 입력창이 비어있거나 공백만 있는 경우
        if (!sudokuInput.value.trim()) {
            return true;
        }
        
        // 모든 셀이 0인지 확인
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] !== 0) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // 빈 보드에 0 채우기
    function fillEmptyBoardWithZeros() {
        let boardText = '';
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                boardText += '0 ';
            }
            if (i < 8) boardText += '\n';
        }
        
        sudokuInput.value = boardText.trim();
        updateBoardFromInput();
    }
    
    // 샘플 삭제 함수
    function deleteSample(sampleId) {
        const sampleBtn = document.getElementById(sampleId);
        if (sampleBtn) {
            if (confirm(`"${sampleBtn.textContent}" 샘플을 삭제하시겠습니까?`)) {
                // 로컬 스토리지에서 삭제
                deleteCustomSample(sampleId);
                // DOM에서 삭제
                sampleBtn.remove();
                selectedSampleForDeletion = null;
            }
        }
    }
    
    // 현재 보드 텍스트 생성
    function generateBoardText() {
        let boardText = '';
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                boardText += board[i][j] + ' ';
            }
            if (i < 8) boardText += '\n';
        }
        return boardText.trim();
    }
    
    // 사용자 정의 샘플 개수 가져오기
    function getCustomSamplesCount() {
        let count = 0;
        const savedSamples = JSON.parse(localStorage.getItem('sudokuCustomSamples') || '{}');
        for (let key in savedSamples) {
            count++;
        }
        return count;
    }
    
    // 사용자 정의 샘플 저장
    function saveCustomSample(id, boardText, name) {
        const savedSamples = JSON.parse(localStorage.getItem('sudokuCustomSamples') || '{}');
        savedSamples[id] = {
            boardText: boardText,
            name: name
        };
        localStorage.setItem('sudokuCustomSamples', JSON.stringify(savedSamples));
    }
    
    // 사용자 정의 샘플 삭제
    function deleteCustomSample(id) {
        const savedSamples = JSON.parse(localStorage.getItem('sudokuCustomSamples') || '{}');
        if (savedSamples[id]) {
            delete savedSamples[id];
            localStorage.setItem('sudokuCustomSamples', JSON.stringify(savedSamples));
        }
    }
    
    // 저장된 사용자 정의 샘플 로드
    function loadCustomSamples() {
        const savedSamples = JSON.parse(localStorage.getItem('sudokuCustomSamples') || '{}');
        for (let id in savedSamples) {
            const sample = savedSamples[id];
            addSampleButton(id, sample.boardText, sample.name, true);
        }
    }

    // 키보드 이벤트 처리 함수
    function handleKeyPress(event) {
        if (!selectedCell || simulationStarted) return;

        const key = event.key;
        
        // 숫자 키(0-9) 처리
        if (/^[0-9]$/.test(key)) {
            const row = parseInt(selectedCell.dataset.row);
            const col = parseInt(selectedCell.dataset.col);
            const num = parseInt(key);
            
            // 보드 업데이트
            board[row][col] = num;
            renderBoard();
            
            // 입력창 업데이트
            updateInputFromBoard();
            
            // 자동으로 시뮬레이션 시작
            if (autoRunSimulation) startSimulation();
        }
    }

    // 입력값에 따라 보드 업데이트 함수
    function updateBoardFromInput() {
        const inputValue = sudokuInput.value.trim();
        if (!inputValue) {
            // 입력값이 없으면 보드 초기화
            board = Array(9).fill().map(() => Array(9).fill(0));
            renderBoard();
            return;
        }

        // 입력값 파싱 시도
        try {
            parseInput(inputValue);
            renderBoard();
        } catch (error) {
            // 파싱 오류 시 무시 (입력 중일 수 있으므로)
            // 불완전한 입력이어도 가능한 만큼 보여주기
            try {
                parsePartialInput(inputValue);
                renderBoard();
            } catch (e) {
                // 부분 파싱도 실패하면 무시
            }
        }
    }

    // 불완전한 입력 파싱 (가능한 만큼만 파싱)
    function parsePartialInput(input) {
        // 임시 보드 초기화
        let tempBoard = Array(9).fill().map(() => Array(9).fill(0));
        
        // 행 단위로 분리
        const rows = input.split('\n').map(row => row.trim()).filter(row => row);
        
        // 각 행을 가능한 만큼 파싱
        for (let i = 0; i < Math.min(rows.length, 9); i++) {
            const nums = rows[i].split(/\s+/).map(num => {
                const parsed = parseInt(num, 10);
                return isNaN(parsed) ? 0 : parsed;
            });
            
            // 각 열에 대해 가능한 만큼 파싱
            for (let j = 0; j < Math.min(nums.length, 9); j++) {
                tempBoard[i][j] = nums[j];
            }
        }
        
        // 파싱된 값으로 보드 업데이트
        board = tempBoard;
    }

    // 초기 상태 설정 함수
    function setInitialState() {
        simulationStarted = false;
        selectedCell = null;
        
        steps = [];
        currentStepIndex = -1;
        stepCount = 0;
        
        // 네비게이션 버튼 상태 업데이트
        updateNavigationButtons();
        
        updateStepInfo();
        renderBoard();
    }

    // 시뮬레이션 시작 함수
    function startSimulation() {
        try {
            // 이미 시뮬레이션이 시작되었다면 중지하고 재시작
            if (simulationStarted) {
                stopAutoPlay();
                steps = [];
                currentStepIndex = -1;
                stepCount = 0;
            }
            
            simulationStarted = true;
            
            // 시뮬레이션 실행
            initialBoard = JSON.parse(JSON.stringify(board));
            runBacktrackingSimulation();
            
            // 첫 번째 단계 표시
            if (steps.length > 0) {
                currentStepIndex = 0;
                renderStep(steps[0]);
                
                // 네비게이션 버튼 상태 업데이트 (중요!)
                updateNavigationButtons();
                
                // 입력 비활성화 (시뮬레이션 중에는 입력 불가)
                sudokuInput.disabled = true;
            } else {
                simulationStarted = false;
                updateNavigationButtons(); // 버튼 상태 업데이트
                alert('유효한 스도쿠 보드가 아니거나 해결 불가능합니다.');
            }
        } catch (error) {
            console.error('시뮬레이션 실행 중 오류 발생:', error);
            alert('시뮬레이션 실행 중 오류가 발생했습니다.\n더 간단한 예제로 다시 시도해 보세요.');
            resetSimulation();
        }
    }
    
    // 네비게이션 버튼 상태 업데이트
    function updateNavigationButtons() {
        // 시뮬레이션이 시작되었다면
        if (simulationStarted) {
            // 첫 단계에서는 이전 단계 버튼 비활성화
            prevBtn.disabled = currentStepIndex <= 0;
            // 마지막 단계에서는 다음 단계 버튼 비활성화
            nextBtn.disabled = currentStepIndex >= steps.length - 1;
            // 시뮬레이션 중에는 자동 진행 버튼 활성화
            autoBtn.disabled = false;
            // 시작 버튼 비활성화
            startBtn.disabled = true;
        } else {
            // 시뮬레이션이 시작되지 않았다면 모든 네비게이션 버튼 비활성화
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            autoBtn.disabled = true;
            // 시작 버튼 활성화
            startBtn.disabled = false;
        }
    }
    
    // 보드에서 입력창으로 데이터 업데이트 함수
    function updateInputFromBoard() {
        let inputText = '';
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                inputText += board[i][j] + ' ';
            }
            if (i < 8) {
                inputText += '\n';
            }
        }
        sudokuInput.value = inputText;
    }

    // 입력값 파싱 함수
    function parseInput(input) {
        // 입력값을 행 단위로 분리
        const rows = input.split('\n').map(row => row.trim()).filter(row => row);
        
        // 공백으로 구분된 경우 처리
        if (rows.length === 1) {
            // 9개의 행으로 나누기
            const allNumbers = rows[0].split(/\s+/).map(num => parseInt(num, 10));
            if (allNumbers.length !== 81) {
                // 9x9 형식인지 확인
                throw new Error('유효하지 않은 입력 형식입니다.');
            }
            
            // 9x9 형식으로 변환
            board = [];
            for (let i = 0; i < 9; i++) {
                board.push(allNumbers.slice(i * 9, (i + 1) * 9));
            }
        } else {
            // 각 행을 파싱
            board = rows.map(row => {
                const nums = row.split(/\s+/).map(num => {
                    const parsed = parseInt(num, 10);
                    return isNaN(parsed) ? 0 : parsed; // 입력값이 없으면 0으로 처리
                });
                
                // 각 행이 9개가 아니면 부족한 부분을 0으로 채움
                while (nums.length < 9) {
                    nums.push(0);
                }
                
                return nums.slice(0, 9); // 9개 열만 사용
            });
            
            // 행이 9개가 아니면 부족한 부분을 0으로 채운 행으로 채움
            while (board.length < 9) {
                board.push(Array(9).fill(0));
            }
            
            // 9행만 사용
            board = board.slice(0, 9);
        }
    }

    // 백트래킹 시뮬레이션 실행 함수
    function runBacktrackingSimulation() {
        steps = [];
        stepCount = 0; // 실제 진행 단계 카운트
        
        // 초기 상태 저장
        steps.push({
            board: JSON.parse(JSON.stringify(board)),
            action: '초기 상태',
            position: null,
            testingValue: null,
            result: null,
            comparingCells: [],
            stepNumber: stepCount
        });
        
        // 백트래킹 시뮬레이션 실행
        const workingBoard = JSON.parse(JSON.stringify(board));
        
        // 안전장치: 스텝 수 제한 (과도한 계산 방지)
        const MAX_STEPS = 5000; // 10000에서 5000으로 줄임
        const result = backtrack(workingBoard, 0, MAX_STEPS);
        
        if (!result && stepCount >= MAX_STEPS) {
            // 무한 루프 방지를 위한 단계 제한에 도달했을 때
            steps.push({
                board: JSON.parse(JSON.stringify(workingBoard)),
                action: '제한 도달',
                position: null,
                testingValue: null,
                result: '단계 제한 도달 - 해결 불가능한 스도쿠일 수 있습니다',
                comparingCells: [],
                stepNumber: stepCount
            });
        }
    }

    // 숫자 유효성 검사 함수
    function isValidPlacement(board, row, col, num) {
        // 행 검사
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) {
                return false;
            }
        }
        
        // 열 검사
        for (let i = 0; i < 9; i++) {
            if (board[i][col] === num) {
                return false;
            }
        }
        
        // 3x3 박스 검사
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) {
                    return false;
                }
            }
        }
        
        return true;
    }

    // 비교 중인 셀 목록 반환 함수
    function getComparingCells(board, row, col, num) {
        const comparingCells = [];
        
        // 행 검사
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) {
                comparingCells.push([row, i]);
            }
        }
        
        // 열 검사
        for (let i = 0; i < 9; i++) {
            if (board[i][col] === num) {
                comparingCells.push([i, col]);
            }
        }
        
        // 3x3 박스 검사
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) {
                    comparingCells.push([boxRow + i, boxCol + j]);
                }
            }
        }
        
        return comparingCells;
    }

    // 파이썬 코드와 유사한 백트래킹 함수 (진행 방향 호출만 단계로 카운트)
    function backtrack(board, n, stepsLeft) {
        // 메모리 사용을 줄이기 위해 일정 단계마다 가비지 컬렉션 유도
        if (steps.length % 1000 === 0 && steps.length > 0) {
            setTimeout(() => {}, 0); // 비동기 작업으로 가비지 컬렉션 기회 제공
        }

        // 단계 제한 확인
        if (stepsLeft <= 0) {
            return false;
        }
        
        // 모든 칸을 다 채웠을 때
        if (n === 81) {
            stepCount++; // 성공 단계도 카운트
            steps.push({
                board: JSON.parse(JSON.stringify(board)),
                action: '완료',
                position: null,
                testingValue: null,
                result: '성공',
                comparingCells: [],
                stepNumber: stepCount
            });
            return true;
        }
        
        const row = Math.floor(n / 9);
        const col = n % 9;
        
        // 이미 값이 채워진 칸이면 다음으로 이동
        if (board[row][col] !== 0) {
            stepCount++; // 다음 칸으로 진행하는 단계 카운트
            steps.push({
                board: JSON.parse(JSON.stringify(board)),
                action: '이미 채워진 칸',
                position: [row, col],
                testingValue: board[row][col],
                result: '건너뛰기',
                comparingCells: [],
                stepNumber: stepCount
            });
            
            // 다음 칸으로 이동 (재귀 호출)
            return backtrack(board, n + 1, stepsLeft - 1);
        }
        
        // 빈 칸에 1~9 시도
        for (let num = 1; num <= 9; num++) {
            // 유효성 검사 - 비교 중인 셀 계산 최적화를 위해 분리
            const isValid = isValidPlacement(board, row, col, num);
            const comparingCells = isValid ? [] : getComparingCells(board, row, col, num);
            
            // 시도 상태 기록 (단계 증가 없음)
            steps.push({
                board: JSON.parse(JSON.stringify(board)),
                action: '시도',
                position: [row, col],
                testingValue: num,
                result: isValid ? '유효함' : '유효하지 않음',
                comparingCells: comparingCells,
                stepNumber: stepCount
            });
            
            if (isValid) {
                // 값 설정
                board[row][col] = num;
                
                // 값 설정 상태 기록 (단계 증가 없음)
                steps.push({
                    board: JSON.parse(JSON.stringify(board)),
                    action: '설정',
                    position: [row, col],
                    testingValue: num,
                    result: '설정됨',
                    comparingCells: [],
                    stepNumber: stepCount
                });
                
                // 다음 칸으로 이동할 때 단계 증가
                stepCount++;
                
                // 다음 칸으로 이동 (재귀 호출)
                const success = backtrack(board, n + 1, stepsLeft - 1);
                if (success) {
                    return true;
                }
                
                // 백트래킹 - 설정한 값 제거 (단계 증가 없음)
                board[row][col] = 0;
                
                // 백트래킹 상태 기록
                steps.push({
                    board: JSON.parse(JSON.stringify(board)),
                    action: '백트래킹',
                    position: [row, col],
                    testingValue: num,
                    result: '제거됨',
                    comparingCells: [],
                    backtrackCell: [row, col],
                    stepNumber: stepCount - 1 // 이전 단계 표시
                });
            }
        }
        
        // 1~9 모두 시도했지만 해결 불가능
        steps.push({
            board: JSON.parse(JSON.stringify(board)),
            action: '실패',
            position: [row, col],
            testingValue: null,
            result: '모든 값 시도 실패',
            comparingCells: [],
            stepNumber: stepCount
        });
        
        return false;
    }

    // 이전 단계 표시 함수
    function showPreviousStep() {
        if (currentStepIndex > 0) {
            const currentStep = steps[currentStepIndex].stepNumber;
            
            // 같은 단계 번호의 이전 액션들을 건너뛰어 이전 단계의 첫 액션으로 이동
            while (currentStepIndex > 0 && steps[currentStepIndex - 1].stepNumber === currentStep) {
                currentStepIndex--;
            }
            
            // 이전 단계로 이동
            if (currentStepIndex > 0) {
                currentStepIndex--;
                
                // 이전 단계의 마지막 액션으로 이동
                const prevStep = steps[currentStepIndex].stepNumber;
                while (currentStepIndex > 0 && steps[currentStepIndex - 1].stepNumber === prevStep) {
                    currentStepIndex--;
                }
            }
            
            renderStep(steps[currentStepIndex]);
            updateNavigationButtons();
        }
    }

    // 다음 단계 표시 함수
    function showNextStep() {
        if (currentStepIndex < steps.length - 1) {
            currentStepIndex++;
            
            // 같은 단계 번호의 다음 액션이 있다면 계속 진행
            if (currentStepIndex < steps.length - 1 && 
                steps[currentStepIndex].stepNumber === steps[currentStepIndex + 1].stepNumber) {
                const currentStep = steps[currentStepIndex].stepNumber;
                while (currentStepIndex < steps.length - 1 && 
                       steps[currentStepIndex + 1].stepNumber === currentStep) {
                    currentStepIndex++;
                }
            }
            
            renderStep(steps[currentStepIndex]);
            updateNavigationButtons();
            
            // 자동 재생 중이고 진행 막대가 표시된 경우, 진행 막대 리셋
            if (autoPlayInterval && autoPlaySpeed > 1000) {
                const timerBar = document.getElementById('timer-progress-bar');
                if (timerBar) {
                    // 트랜지션 없이 즉시 0으로 리셋
                    timerBar.style.transition = 'none';
                    timerBar.style.width = '0%';
                    
                    // 리플로우를 강제로 일으켜 트랜지션 재설정 전에 스타일이 적용되게 함
                    void timerBar.offsetWidth;
                    
                    // 트랜지션 다시 활성화
                    timerBar.style.transition = 'width 50ms linear';
                }
            }
            
            if (currentStepIndex === steps.length - 1) {
                stopAutoPlay();
            }
        }
    }

    // 자동 재생 토글 함수
    function toggleAutoPlay() {
        if (autoPlayInterval) {
            stopAutoPlay();
        } else {
            startAutoPlay();
        }
    }

    // 자동 재생 시작 함수
    function startAutoPlay() {
        if (!autoPlayInterval && currentStepIndex < steps.length - 1) {
            autoBtn.textContent = '일시 정지';
            autoBtn.classList.add('active');
            
            // 현재 시간을 기록하여 진행률 계산의 기준점으로 사용
            progressStartTime = Date.now();
            progressPercent = 0;
            
            // 속도가 1초보다 크면 타이머 막대 표시
            const showProgressBar = autoPlaySpeed > 1000;
            const timerContainer = document.getElementById('timer-progress-container');
            const timerBar = document.getElementById('timer-progress-bar');
            
            if (showProgressBar && timerContainer && timerBar) {
                timerContainer.style.display = 'block';
                
                // 즉시 0%로 설정 (트랜지션 없이)
                timerBar.style.transition = 'none';
                updateTimerProgress(0);
                
                // 리플로우를 강제로 일으켜 트랜지션 재설정 전에 스타일이 적용되게 함
                void timerBar.offsetWidth;
                
                // 트랜지션 다시 활성화
                timerBar.style.transition = 'width 50ms linear';
                
                // 타이머 진행 간격 설정
                const updateInterval = 20; // 20ms마다 업데이트
                
                const progressInterval = setInterval(() => {
                    // 현재 시간 기준으로 경과 시간 계산
                    const now = Date.now();
                    const elapsed = now - progressStartTime;
                    progressPercent = (elapsed / autoPlaySpeed) * 100;
                    
                    // 진행률이 100%를 넘으면 다음 단계로 넘어갈 준비
                    if (progressPercent >= 100) {
                        // 다음 단계로 넘어갈 때는 실제 autoPlayInterval에서 처리됨
                        // 여기서는 진행 막대만 처리
                        progressPercent = 0;
                        progressStartTime = now; // 시작 시간 리셋
                    }
                    
                    updateTimerProgress(progressPercent);
                }, updateInterval);
                
                // 메인 자동 재생 간격 설정
                autoPlayInterval = setInterval(() => {
                    if (currentStepIndex < steps.length - 1) {
                        showNextStep();
                        // 다음 단계로 넘어갈 때 시작 시간 리셋
                        progressStartTime = Date.now();
                        progressPercent = 0;
                    } else {
                        stopAutoPlay();
                    }
                }, autoPlaySpeed);
                
                // 진행 간격 ID도 저장
                autoPlayInterval.progressInterval = progressInterval;
            } else {
                // 막대 숨기기
                if (timerContainer) {
                    timerContainer.style.display = 'none';
                }
                
                // 평소처럼 자동 재생
                autoPlayInterval = setInterval(() => {
                    if (currentStepIndex < steps.length - 1) {
                        showNextStep();
                    } else {
                        stopAutoPlay();
                    }
                }, autoPlaySpeed);
            }
        }
    }
    
    // 타이머 진행 업데이트 함수
    function updateTimerProgress(progress) {
        const timerBar = document.getElementById('timer-progress-bar');
        if (timerBar) {
            timerBar.style.width = `${Math.min(100, progress)}%`;
        }
    }

    // 자동 재생 정지 함수
    function stopAutoPlay() {
        if (autoPlayInterval) {
            // 진행 간격 중지
            if (autoPlayInterval.progressInterval) {
                clearInterval(autoPlayInterval.progressInterval);
            }
            
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
            autoBtn.textContent = '자동 진행';
            autoBtn.classList.remove('active');
            
            // 타이머 막대 숨기기
            const timerContainer = document.getElementById('timer-progress-container');
            if (timerContainer) {
                timerContainer.style.display = 'none';
            }
        }
    }

    // 속도 업데이트 함수
    function updateSpeed() {
        // 이전 속도와 진행률 저장
        const oldSpeed = autoPlaySpeed;
        const oldPercent = progressPercent;
        
        // 새 속도 설정
        autoPlaySpeed = parseInt(speedSlider.value);
        speedValue.textContent = `${autoPlaySpeed}ms`;
        
        // 타이머 진행 막대 표시 여부 업데이트
        const timerContainer = document.getElementById('timer-progress-container');
        if (timerContainer) {
            // 속도가 1초보다 크면 표시 가능 상태로 변경, 자동재생 중이면 표시
            if (autoPlaySpeed > 1000) {
                if (autoPlayInterval) {
                    timerContainer.style.display = 'block';
                }
            } else {
                timerContainer.style.display = 'none';
            }
        }
        
        // 자동 재생 중이면 재시작
        if (autoPlayInterval) {
            // 현재 진행률에 맞게 시작 시간 조정
            // 새 속도를 반영하여 적절한 시작 시간 계산
            const now = Date.now();
            // 기존 진행률을 유지하면서 새 속도에 맞게 시작 시간 조정
            const elapsedInNewSpeed = (oldPercent / 100) * autoPlaySpeed;
            progressStartTime = now - elapsedInNewSpeed;
            
            stopAutoPlay();
            startAutoPlay();
        }
    }

    // 단계 정보 업데이트 함수
    function updateStepInfo() {
        if (currentStepIndex === -1) {
            currentStepElem.textContent = '단계: 0/0';
            currentActionElem.textContent = '동작: -';
            currentPositionElem.textContent = '위치: -';
            testingValueElem.textContent = '테스트 값: -';
            resultElem.textContent = '결과: -';
            return;
        }
        
        const step = steps[currentStepIndex];
        const currentStepNumber = step.stepNumber !== undefined ? step.stepNumber : currentStepIndex;
        const totalSteps = steps[steps.length - 1].stepNumber !== undefined ? 
                          steps[steps.length - 1].stepNumber : steps.length - 1;
        
        currentStepElem.textContent = `단계: ${currentStepNumber}/${totalSteps}`;
        currentActionElem.textContent = `동작: ${step.action}`;
        
        if (step.position) {
            const [row, col] = step.position;
            currentPositionElem.textContent = `위치: (${row + 1}, ${col + 1})`;
        } else {
            currentPositionElem.textContent = '위치: -';
        }
        
        testingValueElem.textContent = step.testingValue !== null ? `테스트 값: ${step.testingValue}` : '테스트 값: -';
        resultElem.textContent = `결과: ${step.result || '-'}`;
    }

    // 단계 렌더링 함수
    function renderStep(step) {
        updateStepInfo();
        renderBoardWithStep(step);
    }

    // 단계에 따른 보드 렌더링 함수
    function renderBoardWithStep(step) {
        // DOM 조작 최소화를 위해 기존 셀 노드 재활용
        const cells = sudokuBoard.children;
        if (cells.length === 0) {
            // 셀이 없으면 처음부터 생성
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    sudokuBoard.appendChild(cell);
                }
            }
        }
        
        // 각 셀 업데이트
        let cellIndex = 0;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = cells[cellIndex++];
                
                // 클래스 초기화 (기존 클래스 제거)
                cell.className = 'cell';
                
                const value = step.board[i][j];
                cell.textContent = value !== 0 ? value : '';
                
                // 초기값인지 확인
                if (initialBoard[i][j] !== 0 && value === initialBoard[i][j]) {
                    cell.classList.add('initial');
                } else if (value !== 0) {
                    cell.classList.add('filled');
                }
                
                // 현재 위치인지 확인
                if (step.position && step.position[0] === i && step.position[1] === j) {
                    cell.classList.add('current-cell');
                }
                
                // 비교 중인 셀인지 확인
                if (step.comparingCells && step.comparingCells.some(pos => pos[0] === i && pos[1] === j)) {
                    cell.classList.add('comparing-cell');
                }
                
                // 백트래킹으로 값이 제거된 셀인지 확인
                if (step.backtrackCell && step.backtrackCell[0] === i && step.backtrackCell[1] === j) {
                    cell.classList.add('backtrack-cell');
                }
            }
        }
    }

    // 보드 렌더링 함수
    function renderBoard() {
        // DOM 조작 최소화를 위해 기존 셀 노드 재활용
        const cells = sudokuBoard.children;
        const needsFullRender = cells.length !== 81;
        
        if (needsFullRender) {
            // 보드가 비어있거나 셀 수가 맞지 않으면 전체 렌더링
            sudokuBoard.innerHTML = '';
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.textContent = board[i][j] !== 0 ? board[i][j] : '';
                    
                    // 셀에 데이터 속성 추가
                    cell.dataset.row = i;
                    cell.dataset.col = j;
                    
                    // 셀 클릭 이벤트 추가
                    cell.addEventListener('click', handleCellClick);
                    
                    // 선택된 셀인지 확인
                    if (selectedCell && 
                        parseInt(selectedCell.dataset.row) === i && 
                        parseInt(selectedCell.dataset.col) === j) {
                        cell.classList.add('selected-cell');
                    }
                    
                    sudokuBoard.appendChild(cell);
                }
            }
        } else {
            // 부분 업데이트 - 기존 셀 내용만 변경
            let cellIndex = 0;
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    const cell = cells[cellIndex++];
                    
                    // 내용 및 클래스 업데이트
                    const cellValue = board[i][j];
                    cell.textContent = cellValue !== 0 ? cellValue : '';
                    
                    // 필요한 클래스만 토글
                    if (selectedCell && 
                        parseInt(selectedCell.dataset.row) === i && 
                        parseInt(selectedCell.dataset.col) === j) {
                        cell.classList.add('selected-cell');
                    } else {
                        cell.classList.remove('selected-cell');
                    }
                }
            }
        }
    }
    
    // 셀 클릭 이벤트 핸들러
    function handleCellClick(event) {
        if (simulationStarted) return; // 시뮬레이션 중이면 무시
        
        // 이전에 선택된 셀의 선택 취소
        if (selectedCell) {
            selectedCell.classList.remove('selected-cell');
        }
        
        // 새 셀 선택
        const cell = event.target;
        cell.classList.add('selected-cell');
        selectedCell = cell;
    }

    // 시뮬레이션 초기화 함수
    function resetSimulation() {
        stopAutoPlay();
        simulationStarted = false;
        sudokuInput.value = '';
        board = Array(9).fill().map(() => Array(9).fill(0));
        steps = [];
        currentStepIndex = -1;
        stepCount = 0;
        
        // 입력 활성화
        sudokuInput.disabled = false;
        
        // 네비게이션 버튼 상태 업데이트
        updateNavigationButtons();
        
        updateStepInfo();
        renderBoard();
    }

    // 입력창에 입력할 때마다 보드만 업데이트하고 시뮬레이션은 실행하지 않음
    sudokuInput.addEventListener('input', () => {
        updateBoardFromInput();
    });
}); 