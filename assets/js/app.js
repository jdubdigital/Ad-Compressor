const inputFile = document.getElementById("input-file");
const compressBtn = document.getElementById("compress-btn");
const downloadLink = document.getElementById("download-link");
const compressionProgress = document.getElementById("compression-progress");
const resizeFactorInput = document.getElementById("resize-factor");
const imageQualityInput = document.getElementById("image-quality");
const compressedSizeElement = document.getElementById("compressed-size");
const imagePreviewsContainer = document.getElementById("image-previews");

const imageFileExtensions = ["jpg", "jpeg", "png", "gif"];

async function compressImage(fileContent, fileName, resizeFactor, imageQuality) {
  const blobUrl = URL.createObjectURL(new Blob([fileContent]));
  const img = new Image();
  img.src = blobUrl;
  await new Promise((resolve) => (img.onload = resolve));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = img.width * resizeFactor;
  canvas.height = img.height * resizeFactor;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", imageQuality);
  });
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

async function displayImagePreviews(fileContent, fileName, resizeFactor, imageQuality) {
  const compressedImageBlob = await compressImage(fileContent, fileName, resizeFactor, imageQuality);
  const blobUrl = URL.createObjectURL(compressedImageBlob);
  const img = new Image();
  img.src = blobUrl;
  img.title = fileName;
  img.style.maxWidth = "300px";
  img.style.maxHeight = "300px";

  imagePreviewsContainer.appendChild(img);
}

function clearImagePreviews() {
  while (imagePreviewsContainer.firstChild) {
    imagePreviewsContainer.removeChild(imagePreviewsContainer.firstChild);
  }
  imagePreviewsContainer.style.display = "none";
}

async function initializeImagePreviews() {
  clearImagePreviews();

  if (inputFile.files.length === 0) {
    return;
  }

  const file = inputFile.files[0];
  const originalZip = new JSZip();
  const fileData = await file.arrayBuffer();
  await originalZip.loadAsync(fileData);

  const resizeFactor = parseFloat(resizeFactorInput.value);
  const imageQuality = parseFloat(imageQualityInput.value);

  for (const fileName in originalZip.files) {
    const fileExtension = fileName.split(".").pop().toLowerCase();

    if (imageFileExtensions.includes(fileExtension)) {
      const fileContent = await originalZip.file(fileName).async("uint8array");
      await displayImagePreviews(fileContent, fileName, resizeFactor, imageQuality);
    }
  }

  imagePreviewsContainer.style.display = "block";
}

async function updateImagePreviewsWithAdjustments() {
  if (inputFile.files.length === 0) {
    return;
  }

  const file = inputFile.files[0];
  const originalZip = new JSZip();
  const fileData = await file.arrayBuffer();
  await originalZip.loadAsync(fileData);

  const resizeFactor = parseFloat(resizeFactorInput.value);
  const imageQuality = parseFloat(imageQualityInput.value);

  const imagesToDisplay = [];

  for (const fileName in originalZip.files) {
    const fileExtension = fileName.split(".").pop().toLowerCase();

    if (imageFileExtensions.includes(fileExtension)) {
      const fileContent = await originalZip.file(fileName).async("uint8array");
      const compressedImageBlob = await compressImage(fileContent, fileName, resizeFactor, imageQuality);
      const blobUrl = URL.createObjectURL(compressedImageBlob);
      imagesToDisplay.push({ blobUrl, fileName });
    }
  }


  clearImagePreviews();

  for (const { blobUrl, fileName } of imagesToDisplay) {
    const img = new Image();
    img.src = blobUrl;
    img.title = fileName;
    img.style.maxWidth = "300px";
    img.style.maxHeight = "300px";
    imagePreviewsContainer.appendChild(img);
  }

  imagePreviewsContainer.style.display = "block";
}

inputFile.addEventListener("change", async () => {
  compressBtn.disabled = inputFile.files.length === 0;
  await initializeImagePreviews();
});

inputFile.addEventListener("change", updateImagePreviewsWithAdjustments);

resizeFactorInput.addEventListener("input", updateImagePreviewsWithAdjustments);
imageQualityInput.addEventListener("input", updateImagePreviewsWithAdjustments);

compressBtn.addEventListener("click", async () => {
  const file = inputFile.files[0];
  if
    (!file) {
    return;
  }

  compressBtn.disabled = true;
  compressionProgress.style.display = "block";
  compressionProgress.value = 0;

  const compressedZip = new JSZip();
  const originalZip = new JSZip();
  const fileData = await file.arrayBuffer();
  const resizeFactor = parseFloat(resizeFactorInput.value);
  const imageQuality = parseFloat(imageQualityInput.value);

  try {
    await originalZip.loadAsync(fileData);
    const totalFiles = Object.keys(originalZip.files).length;
    let processedFiles = 0; for (const fileName in originalZip.files) {
      const fileContent = await originalZip.file(fileName).async("uint8array");
      const fileExtension = fileName.split(".").pop().toLowerCase();

      if (imageFileExtensions.includes(fileExtension)) {
        const compressedImageBlob = await compressImage(fileContent, fileName, resizeFactor, imageQuality);
        compressedZip.file(fileName, compressedImageBlob, { compression: "DEFLATE" });
      } else {
        compressedZip.file(fileName, fileContent, { compression: "DEFLATE" });
      }

      processedFiles += 1;
      compressionProgress.value = (processedFiles / totalFiles) * 100;
    }


    const compressedBlob = await compressedZip.generateAsync({ type: "blob" });
    const downloadUrl = URL.createObjectURL(compressedBlob);

    // Display the compressed file size
    compressedSizeElement.textContent = `Compressed file size: ${formatBytes(compressedBlob.size)}`;
    compressedSizeElement.style.display = "block";

    downloadLink.href = downloadUrl;
    downloadLink.download = "compressed.zip";
    downloadLink.style.display = "block";
  } catch (error) {
    console.error("Error compressing ZIP file:", error);
  } finally {
    compressBtn.disabled = false;
  }
});


// ... Rest of the JavaScript code

const resizeFactorOutput = document.getElementById("resize-factor-output");
const imageQualityOutput = document.getElementById("image-quality-output");

function updateResizeFactorOutput() {
  resizeFactorOutput.value = resizeFactorInput.value;
}

function updateImageQualityOutput() {
  imageQualityOutput.value = imageQualityInput.value;
}

resizeFactorInput.addEventListener("input", updateResizeFactorOutput);
imageQualityInput.addEventListener("input", updateImageQualityOutput);



const resetBtn = document.getElementById("reset-btn");

function reset() {
  inputFile.value = "";
  compressBtn.disabled = true;
  downloadLink.style.display = "none";
  compressedSizeElement.style.display = "none";
  compressionProgress.style.display = "none";
  clearImagePreviews();
}

resetBtn.addEventListener("click", reset);
