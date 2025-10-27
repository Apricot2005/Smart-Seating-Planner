// --- 1. Wait for the page to load ---
document.addEventListener("DOMContentLoaded", () => {
    
    // --- 2. Get references to our NEW HTML elements ---
    const generateBtn = document.getElementById("generate-btn");
    
    // --- 3. Add Event Listeners ---
    // We check if the button exists before adding a listener
    if (generateBtn) {
        generateBtn.addEventListener("click", generatePlan);
    }
});

// --- 4. NEW: Text Parsing Function ---
function parseStudentInput(text) {
    const lines = text.split('\n').filter(line => line.trim() !== ''); // Split by new line, remove empty
    const data = [];
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length === 2 && parts[0] && parts[1]) {
            data.push({
                id: parts[0],
                subject: parts[1]
            });
        } else if (line) { // If the line isn't empty but is wrong
            errors.push(`Line ${i + 1}: "${line}"`);
        }
    }
    
    if (errors.length > 0) {
        alert("Warning: Some lines couldn't be read:\n" + errors.join("\n"));
    }
    
    return data; // Returns a list of objects, e.g., [{id: "S101", subject: "Math"}, ...]
}

// --- 5. The Main "Generate Plan" Function (Updated) ---

async function generatePlan() {
    // Get all our elements again inside this function
    const studentDataInput = document.getElementById("student-data");
    const rowsInput = document.getElementById("room-rows");
    const colsInput = document.getElementById("room-cols");
    const apiKeyInput = document.getElementById("api-key");
    const statusMsg = document.getElementById("status-message");
    const planGrid = document.getElementById("plan-grid");
    const planTableBody = document.getElementById("plan-table-body");
    const aiSummaryBox = document.getElementById("ai-summary");

    // Clear old results
    planGrid.innerHTML = "";
    planTableBody.innerHTML = "";
    aiSummaryBox.style.display = "none";
    aiSummaryBox.innerHTML = "";
    
    statusMsg.textContent = "🧠 Thinking... Generating a valid plan...";
    statusMsg.className = "p-4 rounded-md text-center font-medium text-blue-800 bg-blue-100"; // Blue style

    // Get settings
    const rows = parseInt(rowsInput.value);
    const cols = parseInt(colsInput.value);
    const studentText = studentDataInput.value;
    
    const studentList = parseStudentInput(studentText);

    if (studentList.length === 0) {
        statusMsg.textContent = "❌ Error: Please paste your student list first.";
        statusMsg.className = "p-4 rounded-md text-center font-medium text-red-800 bg-red-100";
        return;
    }

    if (studentList.length > rows * cols) {
        statusMsg.textContent = `❌ Error: Not enough seats (${rows * cols}) for ${studentList.length} students.`;
        statusMsg.className = "p-4 rounded-md text-center font-medium text-red-800 bg-red-100";
        return;
    }

    // --- This is our "Smart" AI (the solver) ---
    // We run it in a setTimeout to let the browser update the "Thinking..." message
    setTimeout(async () => {
        const plan = solveSeating(studentList, rows, cols);

        if (plan) {
            statusMsg.textContent = `🎉 Success! Plan generated for ${plan.length} students.`;
            statusMsg.className = "p-4 rounded-md text-center font-medium text-green-800 bg-green-100";
            
            // Display the results
            displayPlan(plan, rows, cols);
            
            // --- (Optional) Gen AI Summary ---
            const apiKey = apiKeyInput.value;
            if (apiKey) {
                statusMsg.textContent += " Fetching AI Summary...";
                await getAiSummary(plan, apiKey);
            }
        } else {
            statusMsg.textContent = "❌ FAILED: No solution found. Try a larger room or different rules.";
            statusMsg.className = "p-4 rounded-md text-center font-medium text-red-800 bg-red-100";
        }
    }, 50); // 50ms delay
}

// --- 6. The "Smart" Solver (Heuristic Algorithm) ---

function solveSeating(students, rows, cols) {
    let grid = Array(rows).fill(null).map(() => Array(cols).fill(null));
    let shuffledStudents = [...students].sort(() => Math.random() - 0.5);
    let finalPlan = [];

    function findSeat(studentIndex) {
        if (studentIndex >= shuffledStudents.length) {
            return true; 
        }
        const student = shuffledStudents[studentIndex];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] === null && isPlacementValid(student, r, c, grid, rows, cols)) {
                    grid[r][c] = student; 
                    finalPlan.push({ ...student, row: r + 1, seat: c + 1 });
                    if (findSeat(studentIndex + 1)) {
                        return true;
                    }
                    grid[r][c] = null; 
                    finalPlan.pop();
                }
            }
        }
        return false;
    }

    if (findSeat(0)) {
        return finalPlan.sort((a,b) => a.id.localeCompare(b.id));
    } else {
        return null;
    }
}

function isPlacementValid(student, r, c, grid, rows, cols) {
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue; 
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const neighbor = grid[nr][nc];
                if (neighbor && neighbor.subject === student.subject) {
                    return false;
                }
            }
        }
    }
    return true;
}

// --- 7. Display Functions (Updated to target new IDs) ---

function displayPlan(plan, rows, cols) {
    const planGrid = document.getElementById("plan-grid");
    const planTableBody = document.getElementById("plan-table-body");

    // Clear previous results
    planGrid.innerHTML = "";
    planTableBody.innerHTML = "";

    let gridData = {};
    plan.forEach(student => {
        gridData[`${student.row}-${student.seat}`] = student;
    });

    // 1. Setup Grid CSS
    planGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    planGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    // 2. Create Grid Cells
    for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
            const seat = document.createElement("div");
            seat.classList.add("grid-seat");
            
            const student = gridData[`${r}-${c}`];
            if (student) {
                seat.innerHTML = `<strong>${student.id}</strong> (${student.subject})`;
                seat.style.backgroundColor = getSubjectColor(student.subject);
            } else {
                seat.innerHTML = `<span class="text-gray-400 text-sm">(Empty)</span>`;
                seat.style.backgroundColor = "#fdfdfd";
            }
            planGrid.appendChild(seat);
        }
    }

    // 3. Populate Table
    plan.forEach(student => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${student.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.subject}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.row}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.seat}</td>
        `;
        planTableBody.appendChild(row);
    });
}

function getSubjectColor(subject) {
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
        hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - color.length) + color + "33"; // Add alpha
}

// --- 8. Gen AI Function (FOR GEMINI) ---

async function getAiSummary(plan, apiKey) {
    const aiSummaryBox = document.getElementById("ai-summary");
    const statusMsg = document.getElementById("status-message");
    
    const GEMINI_API_URL = `https://generativemodels.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const planText = plan.map(s => `Student ${s.id} (${s.subject}) is at Row ${s.row}, Seat ${s.seat}.`).join("\n");
    
    const prompt = `
        You are an exam administrator. 
        Based on this seating plan data:
        ${planText}
        
        Write a short, friendly summary (in markdown) for the exam proctor. 
        Point out any key patterns (e.g., "Note that all Math students are well-separated").
    `;
    
    try {
        const response = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const error = await response.json(); 
            throw new Error(`API Error: ${error.error.message}`);
        }

        const data = await response.json();
        
        const summary = data.candidates[0].content.parts[0].text; 
        
        let htmlSummary = summary
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^\* (.*$)/gm, '<ul class="list-disc list-inside"><li>$1</li></ul>')
            .replace(/\n/g, "<br>");

        aiSummaryBox.innerHTML = `<h3 class="text-xl font-semibold mb-3 text-indigo-700">🤖 Gen AI Summary</h3><div class="space-y-2 text-gray-700">${htmlSummary}</div>`;
        aiSummaryBox.style.display = "block";
        statusMsg.textContent = `🎉 Success! Plan generated and summary complete.`;

    } catch (error) {
        console.error("Gen AI Error:", error);
        aiSummaryBox.innerHTML = `<h3 class="text-xl font-semibold mb-3 text-red-700">🤖 Gen AI Error</h3><p>${error.message}</p>`;
        aiSummaryBox.style.display = "block";
    }
}
