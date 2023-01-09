// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: user-md;

const icloud = FileManager.iCloud();

let today = new Date();
let df = new DateFormatter();
df.dateFormat = "y_MM"; // date format for path
let photoDirectory = icloud.joinPath(icloud.bookmarkedPath("Essensfotos"),df.string(today));
if (!icloud.isDirectory(photoDirectory)) {
    icloud.createDirectory(photoDirectory, true);
}

const meal = getMeal(today);
const img = await getImage();
const imgString = Data.fromPNG(img).toBase64String();

const wv = new WebView();
await wv.loadHTML("<canvas id='c'></canvas>")

const js = `
const canvas = document.querySelector("#c");
const ctx = canvas.getContext("2d");
const img = new Image();

const loadImage = async () => {
    img.src="data:image/png;base64,${imgString}";
    await img.decode();
}
loadImage().then( () => {
    canvas.height = img.height;
    canvas.width = img.width;
    ctx.drawImage(img, 0, 0);
    completion(canvas.toDataURL("image/jpeg", 0.5).replace("data:image/jpeg;base64,",""))
})
"this is only here to load the rest"
`
const jpgBase64 = await wv.evaluateJavaScript(js, true);
let jpgData = Data.fromBase64String(jpgBase64);

df.dateFormat = "MM_dd_"; // date format for filename
let fullPath = `${photoDirectory}/${df.string(today)}${meal}.jpeg`;

// are we taking multiple photos in the same timeframe? append counter
let count = 1;
while (icloud.fileExists(fullPath)) {
    fullPath = `${photoDirectory}/${df.string(today)}${meal}_${count}.jpeg`
    count++;
}

// write file
icloud.write(fullPath, jpgData);

async function getImage() {
    return await Photos.fromCamera();
}

function getMeal(today) {
    let hrs = today.getHours();

    if (hrs >= 5 && hrs <= 9) {
        return "Frühstück";
    } else if (hrs >= 11 && hrs <= 13) {
        return "Mittagessen";
    } else if (hrs >= 17 && hrs <= 19) {
        return "Abendessen";
    } else {
        return "Snack";
    }
}

Script.complete()