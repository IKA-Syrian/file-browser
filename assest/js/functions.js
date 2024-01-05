$(document).ready(function () {
    let currentCheckedFile = null;
    // Hide all subdirectories initially
    $('#directoryTree ul').hide();

    // Handle click event on folder icon or folder name
    $('#directoryTree').on('click', 'i.fa-chevron-right', function (event) {
        const clickedFolder = $(this);
        const folderPath = clickedFolder.data('path');


        // Make AJAX request to fetch child folders
        if (!clickedFolder.hasClass('loaded')) {
            $.post(`/files/${disk}/dir`, { datapath: folderPath.replace(/^[A-z]:\\/, '') })
                .done(function (response) {
                    const childFolders = response;

                    // Update the DOM to display the child folders
                    if (childFolders && childFolders.length > 0) {
                        const ul = clickedFolder.parent().siblings('ul');
                        childFolders.forEach(folder => {
                            if (folder.children) {
                                ul.append(`
                                <li>
                                    <span class="tree-folder">
                                        <i class="fa fa-chevron-right" aria-hidden="true" data-path="${folder.path}"></i>
                                        <span class="folder-icon fa fa-folder"></span>
                                        <span class="tree-name" data-path="${folder.path}">${folder.name}</span>
                                    </span>
                                    <ul style="display: none;"></ul>
                                </li>`);
                            } else {
                                ul.append(`
                                <li>
                                    <span class="tree-folder folder-icon fa fa-folder" data-path="${folder.path}">
                                        <span class="tree-name" data-path="${folder.path}">${folder.name}</span>
                                    </span>
                                </li>`);
                            }
                        });
                        // ul.append;
                    }

                    // Update styles or other UI changes as needed

                    // Mark as loaded to avoid duplication on subsequent clicks
                    clickedFolder.addClass('loaded');
                })
                .fail(function (error) {
                    console.error('Error fetching child folders:', error);
                });
        }
    });

    $('#directoryTree').on('click', 'i.fa-chevron-right', function () {
        $(this).parent().siblings('ul').toggle();
        $(this).toggleClass('fa-chevron-down');
    });

    // Handle click event on file name
    $('#directoryTree').on('click', 'span.tree-name', function () {
        const clickedFile = $(this);
        const filePath = clickedFile.data('path');
        // Uncheck the previously checked file
        if (currentCheckedFile) {
            currentCheckedFile.removeClass('checked');
        }

        // Toggle the checked state class for the new file
        clickedFile.parent().toggleClass('checked');

        // Update the currently checked file
        currentCheckedFile = clickedFile.parent();
        previousPath = currentPath;
        // Make AJAX request to fetch file details
        $.post(`/files/${disk}`, { path: filePath.replace(/^[A-z]:\\/, ''), username: username })
            .done(function (fileDetails) {
                // Update the .content section with file details
                localStorage.setItem('currentPath', filePath.replace(/^[A-z]:\\/, '').concat('\\'));
                currentPath = filePath.replace(/^[A-z]:\\/, '').concat('\\');
                updateContent(fileDetails);

                // Update styles or other UI changes as needed
            })
            .fail(function (error) {
                console.error('Error fetching file details:', error);
                if (error.status == 403) {
                    alert('You do not have permission to access this folder.');
                } else {
                    alert('Error fetching directory content.');
                }
            });

    });
});

