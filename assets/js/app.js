document.addEventListener('DOMContentLoaded', function () {
  const inputFile = document.getElementById("input-file");
  const compressBtn = document.getElementById("compress-btn");
  const downloadLink = document.getElementById("download-link");
  const compressionProgress = document.getElementById("compression-progress");
  const resizeFactorInput = document.getElementById("resize-factor");
  const imageQualityInput = document.getElementById("image-quality");
  const compressedSizeElement = document.getElementById("compressed-size");
  const imagePreviewsContainer = document.getElementById("image-previews");

  const resizeFactorOutput = document.getElementById("resize-factor-output");
  const imageQualityOutput = document.getElementById("image-quality-output");

  const imageFileExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff", "avif"];

  function syncValues(sliderId, numberInputId) {
    var slider = document.getElementById(sliderId);
    var numberInput = document.getElementById(numberInputId);

    slider.oninput = function () {
      numberInput.value = this.value;
      updateImagePreviewsWithAdjustments(); // Update image previews when slider changes
    };

    numberInput.oninput = function () {
      slider.value = this.value;
      updateImagePreviewsWithAdjustments(); // Update image previews when number input changes
    };
  }

  syncValues('image-quality', 'image-quality-output');
  syncValues('resize-factor', 'resize-factor-output');

  async function compressImage(fileContent, fileName, resizeFactor, imageQuality) {
    const blobUrl = URL.createObjectURL(new Blob([fileContent]));
    const img = new Image();
    img.src = blobUrl;
    await new Promise((resolve) => (img.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width * (resizeFactor / 100);
    canvas.height = img.height * (resizeFactor / 100);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", imageQuality / 100);
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
    const imgId = `preview-${fileName}`;
    let img = document.getElementById(imgId);

    if (!img) {
        img = new Image();
        img.id = imgId;
        img.style.maxWidth = "300px";
        img.style.maxHeight = "300px";
        imagePreviewsContainer.appendChild(img);
    }

    const compressedImageBlob = await compressImage(fileContent, fileName, resizeFactor, imageQuality);
    img.src = URL.createObjectURL(compressedImageBlob);
}


function clearImagePreviews() {
  while (imagePreviewsContainer.firstChild) {
      imagePreviewsContainer.removeChild(imagePreviewsContainer.firstChild);
  }
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
        imagesToDisplay.push({
          blobUrl,
          fileName
        });
      }
    }

    clearImagePreviews();

    for (const {
        blobUrl,
        fileName
      } of imagesToDisplay) {
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
    if (!file) {
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
      let processedFiles = 0;
      for (const fileName in originalZip.files) {
        const fileContent = await originalZip.file(fileName).async("uint8array");
        const fileExtension = fileName.split(".").pop().toLowerCase();

        if (imageFileExtensions.includes(fileExtension)) {
          const compressedImageBlob = await compressImage(fileContent, fileName, resizeFactor, imageQuality);
          compressedZip.file(fileName, compressedImageBlob, {
            compression: "DEFLATE"
          });
        } else {
          compressedZip.file(fileName, fileContent, {
            compression: "DEFLATE"
          });
        }

        processedFiles += 1;
        compressionProgress.value = (processedFiles / totalFiles) * 100;
      }

      const compressedBlob = await compressedZip.generateAsync({
        type: "blob"
      });
      const downloadUrl = URL.createObjectURL(compressedBlob);

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

  const resetBtn = document.getElementById("reset-btn");

  function reset() {
    // Reset file input
    inputFile.value = "";
    compressBtn.disabled = true;
    downloadLink.style.display = "none";
    compressedSizeElement.style.display = "none";
    compressionProgress.style.display = "none";
    clearImagePreviews();

    // Reset range and number inputs to their default values
    resizeFactorInput.value = 100; // Default value for resize factor
    imageQualityInput.value = 75; // Default value for image quality

    resizeFactorOutput.value = 100; // Synchronize with the range input
    imageQualityOutput.value = 75; // Synchronize with the range input

    // Optionally, update image previews after resetting (if required)
    // updateImagePreviewsWithAdjustments();
  }

  resetBtn.addEventListener("click", reset);


  resetBtn.addEventListener("click", reset);

  resizeFactorOutput.addEventListener('input', () => {
    let value = parseFloat(resizeFactorOutput.value);
    value = isNaN(value) ? 0 : value; // Default to 0 if the input is not a number

    if (value > 100) {
      value = 100; // Reset to max if over 100
    } else if (value < 0) {
      value = 0; // Reset to min if below 0
    }

    resizeFactorOutput.value = value; // Set the sanitized value
    resizeFactorInput.value = value; // Synchronize with the range input
    updateImagePreviewsWithAdjustments();
  });

  imageQualityOutput.addEventListener('input', () => {
    let value = parseFloat(imageQualityOutput.value);
    value = isNaN(value) ? 0 : value; // Default to 0 if the input is not a number

    if (value > 100) {
      value = 100; // Reset to max if over 100
    } else if (value < 0) {
      value = 0; // Reset to min if below 0
    }

    imageQualityOutput.value = value; // Set the sanitized value
    imageQualityInput.value = value; // Synchronize with the range input
    updateImagePreviewsWithAdjustments();
  });
});
