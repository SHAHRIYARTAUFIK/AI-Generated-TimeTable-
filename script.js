document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    // The API key is no longer needed here.

    let currentStep = 1;
    let totalSteps = 8; // Updated total steps
    let selectedUniversity = '';
    let selectedSubjects = [];
    let professorAssignments = {};
    let universityPromise = null;
    let selectedCareer = ''; // New variable for career choice
    let dynamicCourseData = null; // To store AI-generated course plan
    let plausibleProfessors = {}; // To store fetched professor names

    // --- Career data mapping ---
    const careerData = {
        'Software Engineer': { field: 'Science', semesters: 8 },
        'Doctor': { field: 'Science', semesters: 10 },
        'Architect': { field: 'Science', semesters: 10 },
        'Chartered Accountant': { field: 'Commerce', semesters: 6 },
        'Investment Banker': { field: 'Commerce', semesters: 6 },
        'Marketing Manager': { field: 'Commerce', semesters: 6 },
        'Lawyer': { field: 'Arts', semesters: 6 },
        'Civil Servant (IAS)': { field: 'Arts', semesters: 6 },
        'Journalist': { field: 'Arts', semesters: 6 }
    };

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.addEventListener('click', () => changeStep(-1));
    nextBtn.addEventListener('click', handleNextClick);

    // --- FALLBACK DATA: Used only if AI course generation fails ---
    const fallbackMockData = {
        Science: {
            subjectsBySemester: { 1: ["Engineering Mathematics I", "Physics I", "Chemistry", "Programming Fundamentals", "Engineering Drawing", "Communication Skills", "Basic Electrical", "Mechanics", "Intro to Engineering", "Calculus I"], 2: ["Engineering Mathematics II", "Physics II", "Data Structures", "Object-Oriented Programming", "Digital Logic", "Basic Electronics", "Advanced Mechanics", "Linear Algebra", "Calculus II", "Workshop Practice"], 3: ["Discrete Mathematics", "Database Systems", "Algorithms", "Operating Systems", "Computer Organization & Architecture", "Probability and Statistics", "Signal Processing", "Data Analysis", "Software Engineering Principles", "Economics for Engineers"], 4: ["Software Engineering", "Computer Networks", "Web Technologies", "Theory of Computation", "Microprocessors & Microcontrollers", "Design and Analysis of Algorithms", "Compiler Design", "AI Fundamentals", "Operating Systems Lab", "Database Lab"], 5: ["Artificial Intelligence", "Machine Learning", "Information Security", "Compiler Design", "Human-Computer Interaction", "Computer Graphics", "Mobile Development", "Cloud Computing Basics", "Advanced Algorithms", "System Software"], 6: ["Cloud Computing", "Distributed Systems", "Data Science", "Advanced Algorithms", "Mobile Computing", "Software Project Management", "Deep Learning", "Natural Language Processing", "Cryptography", "Network Security"], 7: ["Natural Language Processing", "Deep Learning", "Big Data Analytics", "Internet of Things", "Cyber Security", "Project I", "Advanced Databases", "High Performance Computing", "Software Testing", "Agile Methodologies"], 8: ["Internship", "Professional Ethics", "Quantum Computing", "Blockchain Technology", "Entrepreneurship", "Project II", "Research Paper", "Advanced AI", "Patent Law", "Technical Writing"] },
            labs: ["Physics Lab", "Chemistry Lab", "Programming Lab", "Data Structures Lab", "Web Development Lab", "AI/ML Lab"],
            additionalSubjects: ["Intro to Robotics", "Financial Literacy", "Foreign Language (German)", "Psychology 101", "Marketing Basics", "Digital Art", "Public Speaking"],
             recommendations: { core: ["Engineering Mathematics I", "Physics I", "Chemistry", "Programming Fundamentals", "Engineering Drawing", "Communication Skills"], labs: ["Physics Lab", "Programming Lab"], additional: ["Intro to Robotics", "Financial Literacy", "Public Speaking"] }
        },
        Commerce: {
            subjectsBySemester: { 1: ["Financial Accounting", "Business Law", "Principles of Management", "Microeconomics", "Business Communication", "Environmental Studies", "Business Mathematics", "Computer Applications", "Business Ethics", "Indian Economy"], 2: ["Corporate Accounting", "Company Law", "Business Mathematics", "Macroeconomics", "Cost Accounting", "Human Resource Management", "Advanced Statistics", "E-Commerce", "Organizational Behavior", "Business Environment"], 3: ["Income Tax Law & Practice", "Management Accounting", "Marketing Management", "Indian Economy", "E-Commerce", "Business Statistics", "Financial Markets", "Operations Research", "Corporate Finance", "Auditing"], 4: ["Indirect Tax (GST)", "Corporate Governance", "Financial Management", "International Business", "Entrepreneurship Development", "Auditing and Assurance", "Supply Chain Management", "Research Methodology", "Security Analysis", "Portfolio Management"], 5: ["Financial Markets & Institutions", "Organizational Behavior", "Advanced Accounting", "Research Methodology", "Supply Chain Management", "Elective I", "Strategic Management", "International Finance", "Business Analytics", "Risk Management"], 6: ["Project Management", "Business Ethics", "Strategic Management", "Digital Marketing", "Financial Derivatives", "Project Work", "Corporate Restructuring", "Behavioral Finance", "International Marketing", "Retail Management"] },
            labs: ["Tally & ERP Lab", "E-Commerce Lab", "Advanced Excel Lab", "Business Analytics Lab", "Stock Market Simulation Lab", "Digital Marketing Lab"],
            additionalSubjects: ["Public Speaking", "Stock Market Analysis", "Business Analytics", "Intro to Python", "Creative Writing", "Graphic Design", "Sociology"],
             recommendations: { core: ["Financial Accounting", "Business Law", "Principles of Management", "Microeconomics", "Business Communication", "Business Mathematics"], labs: ["Tally & ERP Lab", "Advanced Excel Lab"], additional: ["Stock Market Analysis", "Public Speaking", "Intro to Python"] }
        },
        Arts: {
            subjectsBySemester: { 1: ["History of India (Ancient)", "Introduction to Sociology", "Political Theory", "Basics of Psychology", "English Literature (Poetry)", "Environmental Science", "World History", "Introduction to Philosophy", "Media Studies", "Cultural Studies"], 2: ["History of India (Medieval)", "Social Research Methods", "Indian Polity", "Social Psychology", "English Literature (Drama)", "Indian Society", "Political Thought", "Ethics", "Public Administration", "Developmental Psychology"], 3: ["History of India (Modern)", "Classical Sociological Thought", "International Relations", "Developmental Psychology", "Literary Criticism", "World History", "Public Administration", "Cognitive Psychology", "Indian Philosophy", "Postcolonial Studies"], 4: ["Post-Independence India", "Modern Sociological Theories", "Public Administration", "Abnormal Psychology", "American Literature", "Political Thought", "Comparative Politics", "Industrial Psychology", "Gender Studies", "Film Studies"], 5: ["Introduction to Archaeology", "Gender and Society", "Comparative Politics", "Industrial Psychology", "Postcolonial Literature", "Elective I", "Indian Foreign Policy", "Counseling Psychology", "Literary Theory", "Social Anthropology"], 6: ["Social Movements in India", "Urban Sociology", "Indian Foreign Policy", "Counseling Psychology", "European Literature", "Project Work", "Contemporary India", "Organizational Behavior", "Peace and Conflict Studies", "Dissertation"] },
            labs: ["Fine Arts Workshop", "Journalism & Reporting Lab", "Psychology Practical", "Archaeology Field Work", "Film Appreciation Lab", "Creative Writing Workshop"],
            additionalSubjects: ["Creative Writing", "Photography", "Yoga & Wellness", "Basics of Economics", "Web Design Fundamentals", "Introduction to Marketing", "Data Analysis with Excel"],
            recommendations: { core: ["History of India (Ancient)", "Introduction to Sociology", "Political Theory", "Basics of Psychology", "English Literature (Poetry)", "World History"], labs: ["Journalism & Reporting Lab", "Psychology Practical"], additional: ["Creative Writing", "Basics of Economics", "Photography"] }
        }
    };

    function initializeDynamicSections() {
        const suggestFieldBtn = document.getElementById('suggest-field-btn');
        if(suggestFieldBtn) suggestFieldBtn.style.display = 'none';

        const step1Form = document.getElementById('step1');
        
        const initialAnalysisHTML = `
            <div class="form-section">
                 <div class="section-title">Preliminary AI Analysis</div>
                 <p>Fill in your grades and exam scores, then click here for an initial analysis of your strengths and potential career fields.</p>
                 <button type="button" id="initial-analysis-btn" class="gemini-btn" style="margin-top: 15px;">✨ Get Initial AI Analysis</button>
                 <div id="initial-analysis-result" class="important-note" style="display: none; margin-top: 15px;"></div>
            </div>`;
        step1Form.querySelector('.form-section').after(document.createRange().createContextualFragment(initialAnalysisHTML));

        const examSectionHTML = `
            <div class="form-section">
                <div class="section-title">Competitive Exam Details</div>
                <div class="form-group">
                    <label>Have you appeared for any competitive exams?</label>
                    <select id="competitive-exam-taken">
                        <option value="No" selected>No</option>
                        <option value="Yes">Yes</option>
                    </select>
                </div>
                <div id="competitive-exam-container" style="display: none; margin-top: 15px;">
                    <div id="exam-entries"></div>
                    <button type="button" id="add-exam-btn" class="gemini-btn" style="margin-top: 10px;">+ Add Another Exam</button>
                </div>
            </div>`;
        step1Form.insertAdjacentHTML('beforeend', examSectionHTML);

        document.getElementById('initial-analysis-btn').addEventListener('click', getInitialAnalysis);
        document.getElementById('competitive-exam-taken').addEventListener('change', function() {
            const container = document.getElementById('competitive-exam-container');
            container.style.display = this.value === 'Yes' ? 'block' : 'none';
            if (this.value === 'Yes' && document.getElementById('exam-entries').childElementCount === 0) {
                addExamEntry();
            }
        });

        document.getElementById('add-exam-btn').addEventListener('click', addExamEntry);

        for (let i = 7; i >= 2; i--) {
            const formStep = document.getElementById(`step${i}`);
            if (formStep) formStep.id = `step${i + 1}`;
            const progressStep = document.querySelector(`.step[data-step="${i}"]`);
            if (progressStep) progressStep.dataset.step = i + 1;
        }

        const newStep2 = document.createElement('div');
        newStep2.className = 'form-step';
        newStep2.id = 'step2';
        newStep2.innerHTML = `
            <h2 class="step-title">🎯 Career Choices</h2>
            <div id="ai-career-recommendation" class="important-note" style="display:none;"></div>
            <div class="form-section">
                <div class="section-title">Select Your Career Goal</div>
                <div id="career-options-container" class="cards-container" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));"></div>
                <div id="other-career-section" style="display: none; margin-top: 20px;">
                    <div class="form-group">
                        <label for="other-career-input">Please specify your career goal:</label>
                        <input type="text" id="other-career-input" placeholder="e.g., Data Scientist">
                    </div>
                </div>
            </div>`;
        step1Form.after(newStep2);
        
        const progressStepsContainer = document.querySelector('.progress-steps');
        progressStepsContainer.innerHTML = `
            <div class="step active" data-step="1"><div class="step-circle">1</div><div class="step-label">Student Data</div></div>
            <div class="step" data-step="2"><div class="step-circle">2</div><div class="step-label">Career Goal</div></div>
            <div class="step" data-step="3"><div class="step-circle">3</div><div class="step-label">Field & Semester</div></div>
            <div class="step" data-step="4"><div class="step-circle">4</div><div class="step-label">Course Planning</div></div>
            <div class="step" data-step="5"><div class="step-circle">5</div><div class="step-label">University Selection</div></div>
            <div class="step" data-step="6"><div class="step-circle">6</div><div class="step-label">Faculty Selection</div></div>
            <div class="step" data-step="7"><div class="step-circle">7</div><div class="step-label">Scheduling & Breaks</div></div>
            <div class="step" data-step="8"><div class="step-circle">8</div><div class="step-label">View Timetable</div></div>`;

        const finalStep = document.getElementById('step8');
        if (finalStep) {
            const timetableOutput = finalStep.querySelector('#timetable-output');
            const motivationalHeader = `<h3 id="motivational-header" style="text-align: center; color: #000080; margin-bottom: 20px;"></h3>`;
            if (timetableOutput && !timetableOutput.querySelector('#motivational-header')) {
                timetableOutput.insertAdjacentHTML('afterbegin', motivationalHeader);
            }
        }
    }

    function addExamEntry() {
        const container = document.getElementById('exam-entries');
        const entryDiv = document.createElement('div');
        entryDiv.className = 'form-row exam-entry';
        entryDiv.style.alignItems = 'flex-end';
        entryDiv.innerHTML = `
            <div class="form-group">
                <label>Exam Name <span class="required">*</span></label>
                <input type="text" class="competitive-exam-name" placeholder="e.g., JEE Main">
            </div>
            <div class="form-group">
                <label>Score / Percentile <span class="required">*</span></label>
                <input type="text" class="competitive-exam-score" placeholder="e.g., 98 percentile">
            </div>
            <button type="button" class="btn-secondary remove-exam-btn" style="padding: 10px 15px; height: 45px; margin-bottom: 0;">Remove</button>`;
        container.appendChild(entryDiv);
        entryDiv.querySelector('.remove-exam-btn').addEventListener('click', () => {
            entryDiv.remove();
        });
    }
    
    initializeDynamicSections();
    
    async function getInitialAnalysis() {
        const grade10 = document.getElementById('grade-10').value;
        const grade12 = document.getElementById('grade-12').value;
        if (!grade10 || !grade12) {
            alert("Please fill in your 10th and 12th grade marks for an analysis.");
            return;
        }

        const btn = document.getElementById('initial-analysis-btn');
        btn.disabled = true;
        const resultDiv = document.getElementById('initial-analysis-result');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '✨ Analyzing your profile...';

        let studentProfile = `10th Grade: ${grade10}, 12th Grade: ${grade12}, Skills: ${document.getElementById('skills').value}.`;
        if (document.getElementById('competitive-exam-taken').value === 'Yes') {
            const exams = getExamData();
            if (exams.length > 0) {
                 studentProfile += ` Competitive Exams: ${exams.map(e => `${e.name} (${e.score})`).join(', ')}.`;
            }
        }

        const prompt = `Based on this student profile (${studentProfile}), provide a brief, 2-3 sentence analysis of their academic strengths and suggest 2-3 potential career fields (e.g., engineering, management, humanities) they seem well-suited for. This is a preliminary analysis.`;
        const result = await callAI(prompt);

        resultDiv.innerHTML = result ? `<strong>AI Analysis:</strong> ${result}` : 'Could not fetch analysis.';
        btn.disabled = false;
    }

    function renderCareerChoices() {
        const container = document.getElementById('career-options-container');
        let careerHTML = Object.keys(careerData).map(career => `
            <div class="card career-card" data-career="${career}">
                <h3>${career}</h3>
                <p>Field: ${careerData[career].field}</p>
            </div>`).join('');
        
        careerHTML += `<div class="card career-card" data-career="Other"><h3>Other</h3><p>Specify your own goal</p></div>`;
        container.innerHTML = careerHTML;

        document.querySelectorAll('.career-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.career-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedCareer = card.dataset.career;
                document.getElementById('other-career-section').style.display = selectedCareer === 'Other' ? 'block' : 'none';
            });
        });
    }
    
    async function getAiCareerRecommendation() {
        const container = document.getElementById('ai-career-recommendation');
        container.style.display = 'block';
        container.innerHTML = '✨ AI is analyzing your profile to recommend a career path...';

        let studentProfile = `10th Grade: ${document.getElementById('grade-10').value}, 12th Grade: ${document.getElementById('grade-12').value}, Skills: ${document.getElementById('skills').value}.`;
        const exams = getExamData();
        studentProfile += ` Competitive Exams: ${exams.length > 0 ? exams.map(e => `${e.name} (${e.score})`).join(', ') : 'None'}.`;

        const allCareers = Object.keys(careerData).join(', ');
        const prompt = `Based on the student profile (${studentProfile}), recommend ONE ideal career path. You can choose from this list (${allCareers}) or suggest a different one if more suitable. If the student has not taken exams like JEE or NEET, prioritize careers that don't strictly require them. Provide a 2-sentence justification. Format like: Software Engineer\nJustification: ...`;
        const result = await callAI(prompt);

        if (result) {
            const lines = result.split('\n');
            const recommendedCareer = lines[0].trim();
            const justification = lines.slice(1).join(' ');
            container.innerHTML = `<strong>AI Recommendation:</strong> Based on your profile, the <span class="highlighted-field">${recommendedCareer}</span> path seems like a great fit! <br><br>${justification}`;
            
            const recommendedCard = document.querySelector(`.career-card[data-career="${recommendedCareer}"]`);
            if (recommendedCard) {
                 recommendedCard.click();
            } else {
                document.querySelector('.career-card[data-career="Other"]').click();
                document.getElementById('other-career-input').value = recommendedCareer;
            }
        } else {
            container.innerHTML = 'Could not fetch a career recommendation. Please choose one manually.';
        }
    }
    
    async function getAiCoursePlan() {
        let field = careerData[selectedCareer]?.field;
        let semesters = careerData[selectedCareer]?.semesters;
        const studentSkills = document.getElementById('skills').value;

        if (!field) {
            const fieldPrompt = `What is the most appropriate academic field (Science, Commerce, or Arts) for a student who wants to become a ${selectedCareer}? Respond with only one word.`;
            field = await callAI(fieldPrompt) || 'Science';
            semesters = (field.toLowerCase().includes('science')) ? 8 : 6;
        }
        
        const loaderContainer = document.getElementById('semester-subject-container');
        const step4 = document.getElementById('step4');
        let recommendationDisplay = step4.querySelector('#ai-subject-recommendation-display');
        if (!recommendationDisplay) {
             const suggestionHTML = `<div id="ai-subject-recommendation-display" class="important-note" style="display: none; margin-top: 15px;"></div>`;
            step4.querySelector('#semester-subject-container').insertAdjacentHTML('beforebegin', suggestionHTML);
            recommendationDisplay = step4.querySelector('#ai-subject-recommendation-display');
        }
        
        loaderContainer.innerHTML = '<p>✨ AI is generating a personalized course plan for you...</p>';
        recommendationDisplay.style.display = 'none';

        const prompt = `Generate a comprehensive course plan for a student aiming to become a ${selectedCareer} in the ${field} field over ${semesters} semesters.
        The response MUST be a single, clean JSON object with this exact structure:
        {
          "subjectsBySemester": { "1": ["Subject A", ...], ... },
          "labs": ["Lab 1", ...],
          "additionalSubjects": ["Elective 1", ...]
        }
        RULES:
        1. "subjectsBySemester": For each semester up to ${semesters}, list 10-12 core subjects.
        2. "labs": List 6-8 relevant labs for the whole course.
        3. "additionalSubjects": List 7-9 diverse electives, including 2-3 cross-disciplinary subjects based on these student skills: '${studentSkills || 'None'}'.`;

        const result = await callAI(prompt, { responseMimeType: "application/json" });

        if (result) {
            try {
                dynamicCourseData = JSON.parse(result);
            } catch (e) {
                console.error("Failed to parse AI course plan, using fallback.", e);
                dynamicCourseData = fallbackMockData[field.trim()];
            }
        } else {
             dynamicCourseData = fallbackMockData[field.trim()];
        }
    }

    function renderSubjectSelection() {
        if (!dynamicCourseData) {
             document.getElementById('semester-subject-container').innerHTML = '<p style="color:red">Could not load course data.</p>';
             return;
        }
        
        const step4 = document.getElementById('step4');
        let recommendationDisplay = step4.querySelector('#ai-subject-recommendation-display');
        
        const currentSemester = document.getElementById('current-semester').value;
        let selectableCoreSubjects = [];
        for (let i = 1; i <= currentSemester; i++) {
            if (dynamicCourseData.subjectsBySemester[i]) {
                selectableCoreSubjects.push(...dynamicCourseData.subjectsBySemester[i]);
            }
        }

        const prompt = `A student wants to become a ${selectedCareer}. From the following subjects they are eligible to take, recommend the best combination of 6 core subjects, 2 labs, and 3 additional subjects.
        Eligible Core Subjects: ${selectableCoreSubjects.join(', ')}
        Available Labs: ${dynamicCourseData.labs.join(', ')}
        Available Additional Subjects: ${dynamicCourseData.additionalSubjects.join(', ')}
        Return a single JSON object with keys "core", "labs", and "additional", containing arrays of the recommended subject names.`;

        callAI(prompt, { responseMimeType: "application/json" }).then(recResult => {
            if (recResult) {
                try {
                    const recommendations = JSON.parse(recResult);
                    
                    const validCoreRecs = recommendations.core.filter(subject => selectableCoreSubjects.includes(subject));
                    while (validCoreRecs.length < 6 && selectableCoreSubjects.length > validCoreRecs.length) {
                        const missingSubject = selectableCoreSubjects.find(s => !validCoreRecs.includes(s));
                        if(missingSubject) validCoreRecs.push(missingSubject);
                        else break;
                    }
                    recommendations.core = validCoreRecs;
                    dynamicCourseData.recommendations = recommendations;
                    
                    let recommendationHTML = '<strong>AI Recommended Subjects:</strong><ul>';
                    recommendationHTML += `<li><strong>Core:</strong> ${recommendations.core.join(', ')}</li>`;
                    recommendationHTML += `<li><strong>Labs:</strong> ${recommendations.labs.join(', ')}</li>`;
                    recommendationHTML += `<li><strong>Additional:</strong> ${recommendations.additional.join(', ')}</li>`;
                    recommendationHTML += '</ul>';
                    recommendationDisplay.innerHTML = recommendationHTML;
                    recommendationDisplay.style.display = 'block';
                } catch (e) { console.error("Could not parse recommendations", e); }
            }
        });


        const totalSemesters = Object.keys(dynamicCourseData.subjectsBySemester).length;
        document.getElementById('current-semester').innerHTML = Array.from({ length: totalSemesters }, (_, i) => `<option value="${i + 1}">Semester ${i + 1}</option>`).join('');

        const container = document.getElementById('semester-subject-container');
        container.innerHTML = '';

        for (let i = 1; i <= totalSemesters; i++) {
            if (!dynamicCourseData.subjectsBySemester[i] || dynamicCourseData.subjectsBySemester[i].length === 0) continue;
            const semesterContainer = document.createElement('div');
            semesterContainer.className = 'semester-container';
            const header = document.createElement('div');
            header.className = 'semester-header';
            header.textContent = `Semester ${i} Subjects`;
            semesterContainer.appendChild(header);

            dynamicCourseData.subjectsBySemester[i].forEach(subject => {
                const isDisabled = i > currentSemester ? 'disabled' : '';
                const label = document.createElement('label');
                label.innerHTML = `<input type="checkbox" name="core-subject" value="${subject}" ${isDisabled}> ${subject}`;
                semesterContainer.appendChild(label);
                semesterContainer.appendChild(document.createElement('br'));
            });
            container.appendChild(semesterContainer);
        }
        
        const labsContainer = document.getElementById('labs-container');
        labsContainer.innerHTML = '';
        dynamicCourseData.labs.forEach(lab => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" name="lab-subject" value="${lab}"> ${lab}`;
            labsContainer.appendChild(label);
            labsContainer.appendChild(document.createElement('br'));
        });

        const additionalContainer = document.getElementById('additional-subjects-container');
        additionalContainer.innerHTML = '';
        dynamicCourseData.additionalSubjects.forEach(subject => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" name="additional-subject" value="${subject}"> ${subject}`;
            additionalContainer.appendChild(label);
            additionalContainer.appendChild(document.createElement('br'));
        });

        document.querySelectorAll('#step4 input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', validateSubjectSelection);
        });
        validateSubjectSelection();
    }
    
    // --- UPDATED: Validation logic to match 6-2-3 rule ---
    function validateSubjectSelection() {
        const coreCount = document.querySelectorAll('input[name="core-subject"]:checked').length;
        const additionalCount = document.querySelectorAll('input[name="additional-subject"]:checked').length;
        const labCount = document.querySelectorAll('input[name="lab-subject"]:checked').length;
        const rulesDiv = document.getElementById('subject-selection-rules');
        rulesDiv.innerHTML = `Core Subjects (select 6): ${coreCount}/6 | Labs (select 2): ${labCount}/2 | Additional (select 1-3): ${additionalCount}`;
        
        document.querySelectorAll('input[name="core-subject"]').forEach(cb => {
            const currentSemesterVal = document.getElementById('current-semester').value;
            let semester = 0;
            if (dynamicCourseData && dynamicCourseData.subjectsBySemester) {
                for(const sem in dynamicCourseData.subjectsBySemester) {
                    if(dynamicCourseData.subjectsBySemester[sem].includes(cb.value)) { semester = sem; break; }
                }
            }
            const isFutureSemester = parseInt(semester) > parseInt(currentSemesterVal);
            cb.disabled = (!cb.checked && coreCount >= 6) || isFutureSemester;
        });
        
        document.querySelectorAll('input[name="lab-subject"]').forEach(cb => { cb.disabled = !cb.checked && labCount >= 2; });
        document.querySelectorAll('input[name="additional-subject"]').forEach(cb => { cb.disabled = !cb.checked && additionalCount >= 3; });
        return (coreCount === 6 && additionalCount >= 1 && additionalCount <= 3 && labCount === 2);
    }

    function getExamData() {
        const entries = [];
        document.querySelectorAll('.exam-entry').forEach(entry => {
            const name = entry.querySelector('.competitive-exam-name').value.trim();
            const score = entry.querySelector('.competitive-exam-score').value.trim();
            if (name || score) { entries.push({ name, score }); }
        });
        return entries;
    }

    async function handleNextClick() {
        const currentFormStep = document.querySelector('.form-step.active');
        const requiredTextFields = currentFormStep.querySelectorAll('input[required][type="text"]');
        let allValid = true;
        
        requiredTextFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = 'red';
                allValid = false;
            } else {
                field.style.borderColor = '#ccc';
            }
        });

        if (currentStep === 1 && document.getElementById('competitive-exam-taken').value === 'Yes') {
            let examsValid = true;
            const examEntries = document.querySelectorAll('.exam-entry');

            if (examEntries.length === 0) {
                alert('You selected "Yes" for competitive exams. Please add at least one exam.');
                return;
            }

            examEntries.forEach(entry => {
                const nameInput = entry.querySelector('.competitive-exam-name');
                const scoreInput = entry.querySelector('.competitive-exam-score');
                
                if (!nameInput.value.trim()) { nameInput.style.borderColor = 'red'; examsValid = false; } 
                else { nameInput.style.borderColor = '#ccc'; }

                if (!scoreInput.value.trim()) { scoreInput.style.borderColor = 'red'; examsValid = false; } 
                else { scoreInput.style.borderColor = '#ccc'; }
            });

            if (!examsValid) {
                alert('Please fill in all details for the competitive exams you have added.');
                return;
            }
        }

        if(allValid) {
            try {
                if (currentStep === 1) {
                    renderCareerChoices();
                    await getAiCareerRecommendation();
                } else if (currentStep === 2) {
                    if (selectedCareer === 'Other') {
                        const otherValue = document.getElementById('other-career-input').value.trim();
                        if (!otherValue) { alert('Please specify your career goal.'); return; }
                        selectedCareer = otherValue;
                    }
                    if (!selectedCareer) { alert("Please select a career goal."); return; }
                    let fieldForCareer = careerData[selectedCareer]?.field;
                    if (!fieldForCareer) {
                        const fieldPrompt = `What is the most appropriate academic field (Science, Commerce, or Arts) for a student who wants to become a ${selectedCareer}? Respond with only one word.`;
                        fieldForCareer = await callAI(fieldPrompt) || 'Science';
                    }
                    document.getElementById('field-of-study').value = fieldForCareer;
                    document.getElementById('ai-field-recommendation').innerHTML = `Based on your goal to become a <strong>${selectedCareer}</strong>, the <strong>${fieldForCareer}</strong> field is automatically selected.`;
                    document.getElementById('ai-field-recommendation').style.display = 'block';
                } else if (currentStep === 3) {
                     await getAiCoursePlan();
                     renderSubjectSelection();
                } else if (currentStep === 4) {
                    if (!validateSubjectSelection()) { alert('Please ensure you meet all subject selection requirements:\n- Exactly 6 Core Subjects\n- Exactly 2 Labs\n- Between 1 and 3 Additional Subjects'); return; }
                    selectedSubjects = Array.from(document.querySelectorAll('input[name="core-subject"]:checked, input[name="lab-subject"]:checked, input[name="additional-subject"]:checked')).map(cb => cb.value);
                    preFetchUniversitySuggestions();
                } else if (currentStep === 5) {
                    if (!selectedUniversity) { alert("Please select a university first."); return; }
                    await renderProfessorSelection();
                } else if (currentStep === 6) {
                    getExpenditureDetails(selectedUniversity);
                    renderBreakSelection();
                } else if (currentStep === 7) {
                    await generateTimetable();
                    return; 
                }
                if (currentStep < totalSteps) {
                    changeStep(1);
                }
            } catch (error) {
                console.error(`An error occurred while processing step ${currentStep}:`, error);
                alert(`An unexpected error occurred. Please check the console for details and try again.`);
            }
        } else {
            alert('Please fill all mandatory fields marked with (*).');
        }
    }
    
    // --- The functions below this line are unchanged and correct ---
    
    function changeStep(direction) {
        const currentActiveStep = document.querySelector('.form-step.active');
        if (currentActiveStep) currentActiveStep.classList.remove('active');
        currentStep += direction;
        const nextFormStep = document.getElementById(`step${currentStep}`);
        if (nextFormStep) nextFormStep.classList.add('active');

        const progressSteps = document.querySelectorAll('.step');
        progressSteps.forEach((pStep) => {
            const stepNum = parseInt(pStep.dataset.step, 10);
            pStep.classList.remove('active', 'completed');
            if (stepNum < currentStep) pStep.classList.add('completed');
            else if (stepNum === currentStep) pStep.classList.add('active');
        });

        prevBtn.style.display = currentStep > 1 && currentStep < totalSteps ? 'inline-block' : 'none';
        
        if (currentStep >= totalSteps) {
            nextBtn.textContent = 'Start Over';
            nextBtn.onclick = () => window.location.reload();
            prevBtn.style.display = 'none'; 
        } else if (currentStep === totalSteps - 1) {
            nextBtn.textContent = '✨ Generate Timetable';
        } else {
            nextBtn.textContent = 'Next →';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    async function callAI(prompt, generationConfig = null) {
        const PROXY_URL = 'http://localhost:3000/api/gemini';
        try {
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, generationConfig }),
            });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const data = await response.json();
            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error("Invalid response structure from AI API");
            }
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error("AI API call failed:", error);
            alert("Could not connect to the AI service. Make sure the local server is running. See console for details.");
            return null;
        }
    }
    
    async function preFetchUniversitySuggestions() {
        const field = document.getElementById('field-of-study').value;
        const exams = getExamData();
        const examsString = exams.length > 0 ? exams.map(e => `${e.name} (${e.score})`).join(', ') : 'None';
        const profile = `12th Grade: ${document.getElementById('grade-12').value}, Field: ${field}, Career Goal: ${selectedCareer}, Competitive Exams: ${examsString}, Chosen Subjects: ${selectedSubjects.join(', ')}.`;
        
        const prompt = `Based on the student profile (${profile}), suggest and rank 5 real universities in India. CRITICAL INSTRUCTIONS: 1. Critically evaluate the exam scores. 2. If the student has NOT taken JEE Main/Advanced, DO NOT recommend IITs or NITs. 3. If the student has NOT taken NEET, DO NOT recommend top government medical colleges like AIIMS. 4. If a provided score (e.g., 'JEE Main: 85 percentile') is not realistically sufficient for top-tier institutes, recommend suitable mid-tier or private universities instead. The 'reason' for each university MUST reflect this score analysis. Return a JSON array of objects, each with 'name', 'reason', and 'fit_score' (1.0-10.0) keys.`;
        
        const config = { responseMimeType: "application/json" };
        universityPromise = callAI(prompt, config); 
        displayUniversitySuggestions();
    }

    async function displayUniversitySuggestions() {
        const loader = document.getElementById('university-loader');
        const container = document.getElementById('university-recommendations');
        loader.style.display = 'block';
        container.innerHTML = '';
        const result = await universityPromise;

        if (result) {
            try {
                let universities = JSON.parse(result.replace(/```json/g, '').replace(/```/g, ''));
                universities.sort((a, b) => b.fit_score - a.fit_score);
                container.innerHTML = universities.map(uni => {
                    const colors = getRatingColor(uni.fit_score);
                    return `<div class="card university-card" data-university="${uni.name}" style="background-color: ${colors.background}; border-color: ${colors.border};">
                        <div class="fit-score" style="background-color: ${colors.scoreBg};">${uni.fit_score.toFixed(1)}</div>
                        <h3>${uni.name}</h3>
                        <p>${uni.reason}</p>
                    </div>`;
                }).join('');
                document.querySelectorAll('.card[data-university]').forEach(card => {
                    card.addEventListener('click', () => {
                        document.querySelectorAll('.card[data-university]').forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');
                        selectedUniversity = card.dataset.university;
                    });
                });
            } catch(e) { container.innerHTML = `<p style="color:red">Error parsing university suggestions: ${e.message}</p>`;}
        } else { container.innerHTML = '<p style="color:red">Could not fetch university suggestions.</p>';}
        loader.style.display = 'none';
    }

    function getRatingColor(score) {
        const hue = (score / 10) * 120;
        return {
            background: `hsl(${hue}, 100%, 94%)`,
            border: `hsl(${hue}, 80%, 85%)`,
            scoreBg: `hsl(${hue}, 60%, 50%)`
        };
    }

    async function renderProfessorSelection() {
        const container = document.getElementById('manual-professor-selection');
        container.innerHTML = '<p>Fetching professor data...</p>';
        const prompt = `For the university "${selectedUniversity}", provide a list of 2-3 plausible professor names for each of these subjects: ${selectedSubjects.join(', ')}. Return a JSON object where keys are subjects and values are arrays of professor names.`;
        const config = { responseMimeType: "application/json" };
        const result = await callAI(prompt, config);
        if(result) {
            try {
                const profsBySubject = JSON.parse(result.replace(/```json/g, '').replace(/```/g, ''));
                plausibleProfessors = profsBySubject; // Store for AI assignment
                container.innerHTML = '';
                selectedSubjects.forEach(subject => {
                    const profs = profsBySubject[subject] || ["Prof. A", "Prof. B", "Prof. C"];
                    const formGroup = document.createElement('div');
                    formGroup.className = 'form-group';
                    const label = document.createElement('label');
                    label.textContent = `Professor for ${subject}`;
                    const select = document.createElement('select');
                    select.dataset.subject = subject;
                    select.innerHTML = profs.map(p => `<option value="${p}">${p}</option>`).join('');
                    formGroup.appendChild(label);
                    formGroup.appendChild(select);
                    container.appendChild(formGroup);
                });
            } catch (e) { container.innerHTML = '<p style="color:red">Could not load professor data.</p>'; }
        } else { container.innerHTML = '<p style="color:red">Could not fetch professor data.</p>'; }
    }

    async function getExpenditureDetails(universityName) {
        const loader = document.getElementById('expenditure-loader');
        const detailsDiv = document.getElementById('expenditure-details');
        document.getElementById('selected-uni-name').textContent = universityName;
        loader.style.display = 'block';
        detailsDiv.innerHTML = '';
        const prompt = `Provide an estimated annual academic expenditure for a degree suitable for a future ${selectedCareer} at '${universityName}'. Break down for Offline, Online, and Hybrid modes. Return a JSON object with 'offline', 'online', 'hybrid' keys, each with 'cost' and 'breakdown' strings.`;
        const config = { responseMimeType: "application/json" };
        const result = await callAI(prompt, config);
        if (result) {
            try {
                const costs = JSON.parse(result);
                detailsDiv.innerHTML = `<div class="cards-container">
                        <div class="card"><h3>Offline</h3><p><strong>${costs.offline.cost}</strong></p><p>${costs.offline.breakdown}</p></div>
                        <div class="card"><h3>Online</h3><p><strong>${costs.online.cost}</strong></p><p>${costs.online.breakdown}</p></div>
                        <div class="card"><h3>Hybrid</h3><p><strong>${costs.hybrid.cost}</strong></p><p>${costs.hybrid.breakdown}</p></div>
                    </div>`;
            } catch(e) { detailsDiv.innerHTML = `<p style="color:red">Error parsing expenditure data.</p>`;}
        } else { detailsDiv.innerHTML = '<p style="color:red">Could not fetch expenditure details.</p>';}
        loader.style.display = 'none';
    }
    
    function renderBreakSelection() {
        const container = document.getElementById('daily-break-container');
        container.innerHTML = '';
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        days.forEach(day => {
            const dayContainer = document.createElement('div');
            dayContainer.className = 'day-break-container';
            dayContainer.innerHTML = `
                <div class="day-break-header">${day}</div>
                <div class="form-group">
                    <label><input type="radio" name="break-mode-${day}" value="ai" checked data-day="${day}"> AI-Optimized Break</label>
                    <label><input type="radio" name="break-mode-${day}" value="manual" data-day="${day}"> Manual Break</label>
                </div>
                <div id="ai-break-inputs-${day}">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="break-duration-ai-${day}">Total Break Duration</label>
                            <select id="break-duration-ai-${day}"><option value="1">1 Hour</option><option value="2" selected>2 Hours</option><option value="3">3 Hours</option></select>
                        </div>
                    </div>
                </div>
                <div id="manual-break-inputs-${day}" style="display: none;">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="break-start-manual-${day}">Break Start Time</label>
                            <input type="time" id="break-start-manual-${day}" value="12:00">
                        </div>
                        <div class="form-group">
                            <label for="break-duration-manual-${day}">Break Duration</label>
                            <select id="break-duration-manual-${day}"><option value="1">1 Hour</option><option value="2">2 Hours</option><option value="3">3 Hours</option></select>
                        </div>
                    </div>
                </div>`;
            container.appendChild(dayContainer);
        });

        document.querySelectorAll('input[type=radio][name^="break-mode-"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const day = this.dataset.day;
                document.getElementById(`ai-break-inputs-${day}`).style.display = this.value === 'ai' ? 'block' : 'none';
                document.getElementById(`manual-break-inputs-${day}`).style.display = this.value === 'manual' ? 'block' : 'none';
            });
        });
    }

    async function generateTimetable() {
        if(!selectedUniversity) { alert("Please select a university first."); return; }
        
        const useAiProfs = document.getElementById('ai-choose-profs').checked;
        if (useAiProfs) {
            professorAssignments = {}; // Clear previous manual selections
            selectedSubjects.forEach(subject => {
                const profList = plausibleProfessors[subject];
                if (profList && profList.length > 0) {
                    professorAssignments[subject] = profList[Math.floor(Math.random() * profList.length)];
                } else {
                    professorAssignments[subject] = "AI Assigned Prof.";
                }
            });
        } else {
            professorAssignments = {};
            document.querySelectorAll('#manual-professor-selection select').forEach(select => {
                professorAssignments[select.dataset.subject] = select.value;
            });
        }
        
        changeStep(1); 
        document.getElementById('generation-loader').style.display = 'block';
        document.getElementById('timetable-output').style.display = 'none';
        
        const studentName = document.getElementById('student-name').value;
        const motivationalHeader = document.getElementById('motivational-header');
        if (motivationalHeader) {
            motivationalHeader.innerHTML = `Hello ${studentName}, Future ${selectedCareer}! Here is your personalized schedule:`;
        }
        
        document.getElementById('output-student-name').textContent = studentName;
        document.getElementById('output-university').textContent = selectedUniversity;

        let dailyBreakPreferences = '';
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        days.forEach(day => {
            const breakMode = document.querySelector(`input[name="break-mode-${day}"]:checked`).value;
            let preference;
            if (breakMode === 'manual') {
                const breakStart = document.getElementById(`break-start-manual-${day}`).value;
                const breakDuration = document.getElementById(`break-duration-manual-${day}`).value;
                preference = `For ${day}, the student wants a manual break of ${breakDuration} hours starting at ${breakStart}.`;
            } else {
                const breakDuration = document.getElementById(`break-duration-ai-${day}`).value;
                preference = `For ${day}, the student wants an AI-optimized break totaling ${breakDuration} hours. Place it strategically.`;
            }
            dailyBreakPreferences += preference + ' ';
        });
        
        const subjectsWithProfs = JSON.stringify({ assignments: professorAssignments });
        const prompt = `Create a 5-day weekly timetable (Monday to Friday). Subject/professor assignments are in this JSON: ${subjectsWithProfs}. Classes are 1 hour. ${dailyBreakPreferences} Total daily study hours must be consistent across all days. Output a single, clean JSON object with day names as keys. Each day MUST be an array of objects. Example for one day: "Monday": [{ "time": "09:00 - 10:00", "details": { "subject": "Subject Name", "professor": "Prof. Name" } }, ...]. If a day has no classes, return an empty array for that day, like "Saturday": []. Ensure break duration is met.`;
        const config = { responseMimeType: "application/json" };
        const result = await callAI(prompt, config);

        if (result) {
            try {
                const schedule = JSON.parse(result.replace(/```json/g, '').replace(/```/g, ''));

                if (!schedule || typeof schedule !== 'object' || Object.keys(schedule).length === 0) {
                    throw new Error("AI returned an empty or invalid schedule object.");
                }

                const allSlots = new Set();
                Object.values(schedule).forEach(day => {
                    if (Array.isArray(day)) {
                        day.forEach(slot => {
                            if (slot && slot.time) {
                                allSlots.add(slot.time);
                            }
                        });
                    }
                });
                
                if (allSlots.size === 0) {
                     throw new Error("AI returned a schedule with no valid time slots.");
                }

                const sortedSlots = Array.from(allSlots).sort();
                const timetableBody = document.getElementById('timetable-body');
                timetableBody.innerHTML = '';
                sortedSlots.forEach(time => {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td><strong>${time}</strong></td>`;
                    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach(dayName => {
                        const daySchedule = schedule[dayName];
                        let slot = null;
                        if(Array.isArray(daySchedule)) {
                           slot = daySchedule.find(s => s && s.time === time);
                        }
                        
                        if (slot && slot.details) {
                            if (slot.details.subject.toLowerCase() === 'break') {
                                row.innerHTML += `<td class="break-cell">Break</td>`;
                            } else {
                                row.innerHTML += `<td><span class="subject">${slot.details.subject}</span><span class="professor">${slot.details.professor || ''}</span></td>`;
                            }
                        } else {
                            row.innerHTML += `<td>-</td>`;
                        }
                    });
                    timetableBody.appendChild(row);
                });
            } catch(e) {
                console.error("Error rendering timetable:", e);
                document.getElementById('generation-loader').innerHTML = `<p style="color:red">Error rendering timetable: ${e.message}. Please try again.</p>`;
                return;
            }
        } else {
            document.getElementById('generation-loader').innerHTML = '<p style="color:red">Could not generate timetable from AI. Please try again.</p>';
            return;
        }
        
        const tipsContent = document.getElementById('ai-study-tips');
        tipsContent.innerHTML = '<li>Our AI is generating study tips...</li>';
        const tipsPrompt = `Provide 3 concise, actionable study tips as HTML '<li>' tags for a student with a goal of becoming a ${selectedCareer}, taking these subjects: ${selectedSubjects.join(', ')}.`;
        let tipsResult = await callAI(tipsPrompt);
        if (tipsResult) {
            tipsResult = tipsResult.replace(/```html|```/g, '').trim();
        }
        tipsContent.innerHTML = tipsResult || '<li>Could not load study tips.</li>';

        document.getElementById('generation-loader').style.display = 'none';
        document.getElementById('timetable-output').style.display = 'block';
    }
});


