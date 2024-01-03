let currentPath = '/';
let previousPath = '/';
const urlParams = window.location.pathname;
const disk = urlParams.split('/')[3].replace(/#/g, "") || '';
function handleDirectoryClick(directoryPath) {
    const urlParams = window.location.pathname;
    const disk = urlParams.split('/')[3].replace(/#/g, "") || '';
    let dpath = currentPath + `${directoryPath}`
    console.log(dpath)
    // Make an AJAX request to get the content of the clicked directory
    $.ajax({
        url: `/files/${disk}/`,
        method: 'POST',
        data: { path: dpath },
        success: function (data) {
            // Update the content with the new data
            updateContent(data);
            currentPath = dpath;
            console.log(currentPath)
        },
        error: function () {
            alert('Error fetching directory content.');
        }
    });
}

function back() {
    const urlParams = window.location.pathname;
    const disk = urlParams.split('/')[3].replace(/#/g, "") || '';
    previousPath = currentPath
    let dpath = currentPath.split('/').slice(0, -2).join('/') + '/'
    console.log(dpath)
    // Make an AJAX request to get the content of the clicked directory
    $.ajax({
        url: `/files/${disk}/`,
        method: 'POST',
        data: { path: dpath },
        success: function (data) {
            // Update the content with the new data
            updateContent(data);
            currentPath = dpath;
            console.log(currentPath)
        },
        error: function () {
            alert('Error fetching directory content.');
        }
    });
}

function next() {
    const urlParams = window.location.pathname;
    const disk = urlParams.split('/')[3].replace(/#/g, "") || '';
    let dpath = previousPath
    console.log(dpath)
    // Make an AJAX request to get the content of the clicked directory
    $.ajax({
        url: `/files/${disk}/`,
        method: 'POST',
        data: { path: dpath },
        success: function (data) {
            // Update the content with the new data
            updateContent(data);
            currentPath = dpath;
            console.log(currentPath)
        },
        error: function () {
            alert('Error fetching directory content.');
        }
    });
}

function updateContent(data) {
    console.log(data)
    // Clear existing content
    $('.folders').empty();
    $('.files').empty();
    if (data.Directories.length > 0 || data.files.length > 0) {
        // Update Directories
        if (data.Directories) {
            data.Directories.forEach(directory => {
                // Append new directory to the list
                $('.folders').append(`
                    <li>
                        <span class="folder fa fa-folder" data-path="${directory.path}" onClick="handleDirectoryClick('${directory.path}')"><span class="folder-name" >${directory.name}</span></span>
                    </li>
                `);
            });
            // Update Files
        }
        if (data.files) {
            data.files.forEach(file => {
                // Append new file to the list
                $('.files').append(`
                    <li>
                        <span class="file fa ${file.fa}" onclick="showFileMetadata('${file.name}')" ><span class="file-name" >${file.name}</span></span>
                    </li>
                `);
            });
        }
    } else {
        $('.files').append(`<div>This folder is Empty</div>`);
    }
}

// script.js

function showFileMetadata(fileName) {
    // Make an API request to fetch metadata for the clicked file
    // Replace the API_URL with the actual URL of your metadata API
    const urlParams = window.location.pathname;
    const disk = urlParams.split('/')[3].replace(/#/g, "") || '';
    let filePath = currentPath + `${fileName}`
    fetch(`/files/${disk}/info`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
    })
        .then(response => response.json())
        .then(metadata => {
            // Populate the popup content with the metadata
            const mainpopup = document.getElementById('metadataPopup');
            const popup = document.getElementById('popup-content');
            popup.innerHTML = `<h3>${fileName} Metadata</h3>`;
            console.log(metadata)
            for (const key in metadata) {
                popup.innerHTML += `<p><strong>${key}:</strong>`;
                for (const key2 in metadata[key]) {
                    popup.innerHTML += `<br>${key2}: ${metadata[key][key2]}`
                }
                popup.innerHTML += `</p>`;
            }
            // Show the popup
            popup.innerHTML += `<br><button onclick="closeMetadataPopup()">Close</button>`;

            mainpopup.style.display = 'block';
        })
        .catch(error => console.error('Error fetching metadata:', error));
}

function closeMetadataPopup() {
    // Close the popup
    const popup = document.getElementById('metadataPopup');
    popup.style.display = 'none';
}
function closePopup() {
    document.getElementById('metadataPopup').style.display = 'none';
}
function toggleView() {
    const content = document.querySelector('.content');
    content.classList.toggle('icon-view'); // Toggle the 'icon-view' class
    localStorage.setItem('view', content.classList);
}

function changeElementSize(action) {
    const root = document.documentElement; // Reference to the :root element

    // Get the current size from CSS variable or set a default size
    let currentSize = parseInt(getComputedStyle(root).getPropertyValue('--explorer-font-size')) || 18;
    let currentIconSize = parseInt(getComputedStyle(root).getPropertyValue('--explorer-icon-font-size')) || 18;
    if (action === 'increase') {
        currentSize += 2;
        currentIconSize += 2;
    } else if (action === 'decrease') {
        currentSize -= 2;
        currentIconSize -= 2;
    }
    localStorage.setItem('userFontSize', currentSize);
    localStorage.setItem('userIconSize', currentIconSize);
    // Update the CSS variable value
    root.style.setProperty('--explorer-font-size', `${currentSize}px`);
    root.style.setProperty('--explorer-icon-font-size', `${currentIconSize}px`);
}

document.addEventListener('DOMContentLoaded', function () {
    const root = document.documentElement; // Define root here

    const userFontSize = localStorage.getItem('userFontSize');
    const userIconSize = localStorage.getItem('userIconSize');
    const view = localStorage.getItem('view');

    if (userFontSize) {
        root.style.setProperty('--explorer-font-size', `${userFontSize}px`);
    }
    if (userIconSize) {
        root.style.setProperty('--explorer-icon-font-size', `${userIconSize}px`);
    }
    if (view) {
        const content = document.querySelector('.content');
        content.classList = view;
    }
});

