$(document).ready(function() {
    $('#create-experiment').click(function() {
        $.post('/experiment/new', {}, function(data, status) {
        if (status === 'success') {
            // Navigate to the new experiment page
            window.location.href = '/experiment/' + data.experimentId;
        } else {
            // Handle error...
        }
        });
    });
    $('#load-experiment').click(function(event) {
        event.preventDefault();
        alert("Load Existing Experiment button clicked.");
        // TODO: Add functionality to load an existing experiment
    });
});
