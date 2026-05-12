async function summarizeText() {
    const text = document.getElementById("inputText").value;

    if (!text) {
        alert("Enter text");
        return;
    }

    const response = await fetch("http://localhost:5000/summarize", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
    });

    const data = await response.json();

    document.getElementById("output").innerHTML =
        data.summary.replace(/\n/g, "<br>");
}

// PDF upload
async function uploadPDF() {
    const fileInput = document.getElementById("pdfFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Select a PDF file");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://localhost:5000/upload-pdf", {
        method: "POST",
        body: formData
    });

    const data = await response.json();

    document.getElementById("output").innerHTML =
        data.summary.replace(/\n/g, "<br>");
}