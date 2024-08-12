// Fetch the Markdown file
fetch('content.md')
    .then(response => response.text())
    .then(text => {
        // Convert Markdown to HTML using marked.js
        const htmlContent = marked(text);
        // Insert the HTML content into the page
        document.getElementById('content').innerHTML = htmlContent;
    })
    .catch(error => console.error('Error fetching markdown file:', error));