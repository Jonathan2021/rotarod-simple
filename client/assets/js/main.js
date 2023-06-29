$(document).ready(function() {
    // Listener for ethic-widget
    $('#ethic-widget').on('click', function() {
        window.location.href = "/projects";
    });

    // Listener for group-widget
    $('#group-widget').on('click', function() {
        window.location.href = "/groups";
    });

    // Listener for create-study
    $('#create-study').on('click', function() {
        // Prompt for a study title
        let title = prompt("Enter the study title");

        // Check if title is empty or cancelled
        if (!title) {
            alert("Title cannot be empty!");
            return;
        }

        // Send a POST request to /study
        $.ajax({
            url: '/study',
            type: 'POST',
            data: {
                title: title,
                // Add any other data you need to send here
            },
            success: function(data) {
                // On success, redirect to the new study's form
                window.location.href = "/study/" + data.id + "/form";
            },
            error: function(jqXHR, textStatus, errorThrown) {
                // Check if conflict error
                if (jqXHR.status === 409) {
                    let response = JSON.parse(jqXHR.responseText);
                    let confirmation = confirm(response.error + " Do you want to load the existing study?");
                    if (confirmation) {
                        // On confirmation, redirect to the existing study's form
                        window.location.href = "/study/" + response.id + "/form";
                    } else {
                        // If user cancels, simply return to the main menu or do nothing
                        // Depends on the current design of the website
                        // For instance, if you are already in the main menu, you might not need to do anything
                    }
                } else {
                    // Handle any other errors here
                    console.error('Error creating study:', textStatus, errorThrown);
                }
            }
        });
    });
});
