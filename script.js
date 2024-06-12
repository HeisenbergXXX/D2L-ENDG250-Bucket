// This script is for the ENGD250 grade bucket. It allows the instructor to import a CSV file and display the data on the page for further processing.

// Author: Bennett Xia
// First created: 2024-06-09

const users = [];
const key = [];
const tolerance = [0.005, 0.01, 0.015, 0.02, 0.025, 0.03];
const gradeMulti = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0];
let radius = 0;   //tolerence radius for center of mass
const testTitle = 'test';
const totalPoints = 30;

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');

    const fileInput = document.getElementById('fileInput');
    const keyInput = document.getElementById('keyInput');
    const importButton = document.getElementById('importButton');
    const processButton = document.getElementById('processButton');
    const importKeyButton = document.getElementById('importKeyButton');
    const output = document.getElementById('output');

    if (importButton && fileInput && processButton && importKeyButton) {
        console.log('Elements found');

        importKeyButton.addEventListener('click', function() {
            console.log('Import key button clicked');
            keyInput.click();
        });

        keyInput.addEventListener('change', function(event) {
            console.log('Key input changed');
            const keyFile = event.target.files[0];
            if (keyFile) {
                console.log('Key file selected:', keyFile.name);
                const reader = new FileReader();
                reader.onload = function(e) {
                    const data = e.target.result;
                    console.log(data);

                    getKey(data);

                    if (key.length > 0) {
                        keyIndicator.style.display = 'block';
                        importKeyButton.style.display = 'none';
                        console.log('Key uploaded successfully');
                    } else {
                        console.error('Key not found');
                    }
                };
                reader.readAsText(keyFile);
            } else {
                alert('No key file selected');
            }
        });

        importButton.addEventListener('click', function() {
            console.log('Import button clicked');
            fileInput.click();
        });

        fileInput.addEventListener('change', function(event) {
            console.log('File input changed');
            const file = event.target.files[0];

            if (file) {
                console.log('File selected:', file.name);
                const reader = new FileReader();
                reader.onload = function(e) {
                    const contents = e.target.result;
                    // processCsvData(contents);
                    output.textContent = contents;

                    processButton.style.display = 'block';

                    processButton.addEventListener('click', function() {
                        // alert('Processing the file...');
                        output.textContent = '';

                        if (key) {
                            try {
                                processCsvData(contents);
                                makeTableDev(users);
                            } catch (error) {
                                alert('An error occurred while processing CSV data:', error);
                                console.error('An error occurred while processing CSV data:', error);
                            }
                        } else {
                            alert('Please import the keyFile first!');
                            console.error('Key not found');
                        }

                    });
                    //hide the import button after importing
                    importButton.style.display = 'none';
                    docIndicator.style.display = 'block';

                };
                reader.readAsText(file);
            } else {
                alert('No file selected');
            }
        });


        // Export button
        const exportButton = document.getElementById('exportButton');
        exportButton.addEventListener('click', function() {
            console.log('Export button clicked');
            const csv = `Username,${testTitle},End-of-Line Indicator\n` + users.map(user => {
                return `#${user.username},${user.q.reduce((acc, question) => acc + bucket(question.qd) * question.qp, 0).toFixed(2)},#`;
            }).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ENGD250_GradeBucket.csv';
            a.click();

            // //indicator for exporting
            // exportedIndicator.style.display = 'block';
            // //get the saved path and display it
            // document.getElementById('exportPath').textContent = a.href;
        });

    } else {
        console.error('Elements not found');
    }
});

function getKey(data) {
    // Get answer keys for each question from imported csv file
    const lines = data.split('\n');
    const answer = lines[0].split(',');
    for (let i = 0; i < answer.length; i++) {
        key.push(answer[i]);
    }
    console.log(key);
    return key;
}

function processCsvData(data) {
    console.log('Processing CSV data...');

    let currentUser = null;

    // Split the data into rows
    const lines = data.split('\n');

    // Loop through each row, if the same username, add to the same user object
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line === "") continue; // Skip empty lines
        if (line.split(',')[9] === "") continue; //skip the first and last line of each student

        const parts = line.split(',');
        const username = parts[1];
        const firstname = parts[2];
        const lastname = parts[3];
        const qn = parts[8];
        let qa = parseFloat(parts[14]);
        const qp = parts[17];
        let qk = parseFloat(key[qn - 1]);   //key for the question
        let deviation = 100;      //zero is ideal

        //check for null value and replace with something
        // qa === "" ? qa = 'null' : qa = parseFloat(qa);

        //check key if it is zero
        if (qk !== 0) {
            deviation = Math.abs((qa - qk) / qk);
        } else {
            deviation = Math.abs(qa);
        }

        // Check if the username is the same as the previous row
        if (currentUser && username === currentUser.username) {
            currentUser.q.push({ qn: qn, qa: qa, qp: qp, qd: deviation});  
        } else {
            // Add the previous user object to the users array
            if (currentUser) {
                users.push(currentUser);
            }

            // Create a new user object
            currentUser = {
                username: username,
                firstname: firstname,
                lastname: lastname,
                q: [{ qn: qn, qa: qa, qp: qp, qd: deviation}]
            };
        }
    }

    // Add the last user to the array
    if (currentUser) {
        users.push(currentUser);
    }
}

function displayUser(user) {
    const output = document.getElementById('output');
    output.textContent += `${user.username}, ${user.firstname}, ${user.lastname}, `;
    user.q.forEach(question => {
        output.textContent += `${question.qa}, `;
    });
    output.textContent += '\n';

    //hide the process and import button after processing
    processButton.style.display = 'none';
    importButton.style.display = 'none';
    //show the export button after processing
    exportButton.style.display = 'block';
}

function makeTableDev(users) {
    //create table
    const table = document.createElement('table');
    table.setAttribute('border', '1');
    table.setAttribute('cellpadding', '5');
    table.setAttribute('cellspacing', '0');

    //create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Username', 'First Name', 'Last Name'].forEach(headerText => {
        const headerCell = document.createElement('th');
        headerCell.textContent = headerText;
        headerRow.appendChild(headerCell);
    });
    
    //add total to the header
    const totalCell = document.createElement('th');
    totalCell.textContent = 'Total';
    headerRow.appendChild(totalCell);
    
    //add percentage to the header
    const percentCell = document.createElement('th');
    percentCell.textContent = 'Grade %';
    headerRow.appendChild(percentCell);
    
    //add question number to the header based on the amount of questions
    users[0].q.forEach(question => {
        const headerCell = document.createElement('th');
        headerCell.textContent = 'Q' + question.qn;
        headerRow.appendChild(headerCell);
    });
    
    //add center of mass to the header
    const CoMCell = document.createElement('th');
    CoMCell.textContent = ' CoM Deviation(unit: in/mm) ';
    CoMCell.setAttribute('colspan', '3');
    headerRow.appendChild(CoMCell);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    //create table body
    const tbody = document.createElement('tbody');
    users.forEach(user => {
        const row = document.createElement('tr');

        const usernameCell = document.createElement('td');
        usernameCell.textContent = user.username;
        row.appendChild(usernameCell);

        const firstnameCell = document.createElement('td');
        firstnameCell.textContent = user.firstname;
        row.appendChild(firstnameCell);
        
        const lastnameCell = document.createElement('td');
        lastnameCell.textContent = user.lastname;
        row.appendChild(lastnameCell);

        const totalCell = document.createElement('td');
        totalCell.textContent = user.q.reduce((acc, question) => acc + bucket(question.qd) * question.qp, 0).toFixed(2);
        row.appendChild(totalCell);

        const PercentCell = document.createElement('td');
        PercentCell.textContent = (user.q.reduce((acc, question) => acc + bucket(question.qd) * question.qp, 0)/totalPoints * 100).toFixed(2) + '%';
        row.appendChild(PercentCell);
        
        user.q.forEach(question => {
            const qaCell = document.createElement('td');
            qaCell.textContent = (bucket(question.qd) * question.qp).toFixed(2).replace(/\.?0+$/, '');
            // qaCell.textContent += '(' + question.qa + ')';
            // qaCell.textContent += '(' + question.qd.toFixed(4) + ')';
            row.appendChild(qaCell);
        });


        const part1CoMCell = document.createElement('td'); 
        part1CoMCell.textContent = Math.sqrt(Math.pow(user.q[2].qa-key[2], 2) + 
                                    Math.pow(user.q[3].qa-key[3], 2) + 
                                    Math.pow(user.q[4].qa-key[4], 2)).toFixed(3);
        part1CoMCell.textContent += '(Part1)';
        row.appendChild(part1CoMCell);

        const part2CoMCell = document.createElement('td');
        part2CoMCell.textContent = Math.sqrt(Math.pow(user.q[7].qa-key[7], 2) +
                                    Math.pow(user.q[8].qa-key[8], 2) +
                                    Math.pow(user.q[9].qa-key[9], 2)).toFixed(3);
        part2CoMCell.textContent += '(Part2)';                            
        row.appendChild(part2CoMCell);

        const part3CoMCell = document.createElement('td');
        part3CoMCell.textContent = Math.sqrt(Math.pow(user.q[12].qa-key[12], 2) +
                                    Math.pow(user.q[13].qa-key[13], 2) +
                                    Math.pow(user.q[14].qa-key[14], 2)).toFixed(3);
        part3CoMCell.textContent += '(Part3)';
        row.appendChild(part3CoMCell);        


        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    //append table to the output div
    output.appendChild(table);

    //hide the process and import button after processing
    // processButton.style.display = 'none';
    importButton.style.display = 'none';
    //show the export button after processing
    exportButton.style.display = 'block';

    //calculate and display class average
    let sum = 0;
    let count = 0;
    users.forEach(user => {
        sum += user.q.reduce((acc, question) => acc + bucket(question.qd) * question.qp, 0);
        count++;
    });
    console.log('Class sum:', sum);
    const average = sum / count / key.length;
    console.log('Class average:', average);
    document.getElementById('classAverage').textContent = 'Class average: ' + (average*100).toFixed(2)+ '%';
    document.getElementById('classAverage').style.display = 'block';
    document.getElementById('classCount').textContent = 'Head Count: ' + count;
    document.getElementById('classCount').style.display = 'block';
}

function bucket(dev) {
    for (let i = 0; i < tolerance.length; i++) {

        if (dev <= tolerance[i]) {
            return gradeMulti[i];
        }
    }

    // if (dev <= 0.01) {return 1;}    

    return 0;
}


