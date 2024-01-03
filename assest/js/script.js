

// Function to render the directory tree
function renderTree(treeData) {
    const treeElement = document.querySelector('.tree ul');
    treeElement.innerHTML = buildTreeHTML(treeData);
}

// Recursive function to build HTML for the directory tree
function buildTreeHTML(treeData) {
    let html = '';
    treeData.forEach(item => {
        html += `<li><span class="folder" data-path="${item.path}">${item.name}</span>`;
        if (item.children && item.children.length > 0) {
            html += `<ul>${buildTreeHTML(item.children)}</ul>`;
        }
        html += '</li>';
    });
    return html;
}

// Function to render the file list
function renderFiles(filesData) {
    const filesElement = document.querySelector('.files ul');
    filesElement.innerHTML = buildFilesHTML(filesData);
}

// Function to build HTML for the file list
function buildFilesHTML(filesData) {
    return filesData.map(file => `<li><span class="file">${file}</span></li>`).join('');
}

// Function to render file details (optional)
// function renderDetails(detailsData) {
//     const detailsElement = document.querySelector('.details');
//     detailsElement.innerHTML = `<p>File Details: ${detailsData}</p>`;
// }

// Event listener for folder clicks
// document.addEventListener('click', async (event) => {
//     const folderElement = event.target.closest('.folder');
//     if (folderElement) {
//         const path = folderElement.getAttribute('data-path') || '/';
//         await renderDirectory(path);
//     }
// });

// In your script.js file


function updateGridLayout() {
    const iconView = document.querySelector('.icon-view');
    const totalWidth = iconView.offsetWidth;
    const elementWidth = 120; // Adjust this based on your desired element width

    const newColumns = Math.floor(totalWidth / elementWidth);
    iconView.style.gridTemplateColumns = `repeat(auto-fill, minmax(${elementWidth}px, 1fr))`;
}

// Add an event listener for window resize
window.addEventListener('resize', updateGridLayout);

// Initial update when the page loads
window.addEventListener('load', updateGridLayout);
