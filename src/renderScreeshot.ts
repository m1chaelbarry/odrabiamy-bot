import puppeteer from 'puppeteer'

export default function getExerciseImage(solution: string, excercise_number: string, page_number: string, book_name: string): Promise<Buffer | null> {
    return new Promise(async (resolve) => {

        
        const browser = await puppeteer.launch({timeout: 100000, args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await browser.newPage();
        await page.setViewport({width: 780, height: 1});
        let decoded_solution = solution
	decoded_solution = importKatex + decoded_solution
        decoded_solution = `<h1 style="font-size:30;"> ${excercise_number}/${page_number} </h1>` + decoded_solution
        decoded_solution = `<style>html * {font-family: MulishVariable,sans-serif;${decoded_solution.includes('class="math') ? '' : 'background: #36393E; color: #FFFFFF'};}</style>` + decoded_solution
        decoded_solution = decoded_solution.replaceAll(/<object class="math small".*?>/g, '')
        decoded_solution = decoded_solution + `<p style="text-align: right; font-size: xx-small; color: #7F7F7F;"> ${book_name} &emsp;</p>`
        const loaded = page.waitForNavigation({waitUntil: 'load'});
        const loaded2 = page.waitForTimeout(2500)
        await page.setContent(decoded_solution, {waitUntil: 'networkidle0'});
        await loaded2;
        await loaded
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        await page.setViewport({width: bodyWidth, height: bodyHeight});
        const screenshot = await page.screenshot({fullPage: true})

        if (Buffer.isBuffer(screenshot)) {
            resolve(screenshot)
        } else {
            resolve(null)
        }

        await browser.close();


    });
}


const importKatex = `
<!DOCTYPE html>
<head>
<meta charset='UTF-8'>
<style>
@font-face{font-family:KaTeX_Main fallback;size-adjust:95%;src:local("Times New Roman"),local("LiberationSerif")}@font-face{font-family:KaTeX_Main fallback;size-adjust:83%;src:local("Noto Serif")}:root{--odr-text-decoration-color:currentColor;--odr-math-text-font-family:KaTeX_Main,"KaTeX_Main fallback",serif}.odr-strikethrough{text-decoration-color:var(--odr-text-decoration-color)}.odr-downdiagonalstrike,.odr-updiagonalstrike{-webkit-text-size-adjust:100%;text-size-adjust:100%;display:inline-block;position:relative;white-space:nowrap}.odr-downdiagonalstrike:not(.odr-strikethrough),.odr-updiagonalstrike:not(.odr-strikethrough){text-decoration:none}.odr-downdiagonalstrike:after,.odr-updiagonalstrike:before{bottom:0;content:"";left:0;position:absolute;right:0;top:0}.odr-updiagonalstrike:before{background:linear-gradient(to right bottom,transparent calc(50% - 1px),var(--odr-text-decoration-color) 49.5%,var(--odr-text-decoration-color) 50.5%,transparent calc(50% + 1px))}.odr-downdiagonalstrike:after{background:linear-gradient(to right top,transparent calc(50% - 1px),var(--odr-text-decoration-color) 49.5%,var(--odr-text-decoration-color) 50.5%,transparent calc(50% + 1px))}.odr-updiagonalstrike:before.odr-downdiagonalstrike:after{background:linear-gradient(to right bottom,transparent calc(50% - 1px),var(--odr-text-decoration-color) 49.5%,var(--odr-text-decoration-color) 50.5%,transparent calc(50% + 1px)),linear-gradient(to right top,transparent calc(50% - 1px),var(--odr-text-decoration-color) 49.5%,var(--odr-text-decoration-color) 50.5%,transparent calc(50% + 1px))}.odr-comment,.odr-footnote{font-size:.8333357142857143em}math-expr{font-size:1.15rem}.katex{font-family:var(--odr-math-text-font-family)}.katex-display>.katex{white-space:normal}.katex-html>.base{padding-bottom:.25em;padding-top:.25em} 
</style>
<link href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.css" rel="stylesheet"/>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.js"></script>
<script src="https://unpkg.com/asciimath2tex@1.2.1/dist/asciimath2tex.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/mhchem.min.js"></script>
<script>
  window.WebFontConfig = {
    custom: {
      families: ['KaTeX_AMS', 'KaTeX_Caligraphic:n4,n7', 'KaTeX_Fraktur:n4,n7',
        'KaTeX_Main:n4,n7,i4,i7', 'KaTeX_Math:i4,i7', 'KaTeX_Script',
        'KaTeX_SansSerif:n4,n7,i4', 'KaTeX_Size1', 'KaTeX_Size2', 'KaTeX_Size3',
        'KaTeX_Size4', 'KaTeX_Typewriter'],
    },
  };
</script>
<script src="https://cdn.jsdelivr.net/npm/webfontloader@1.6.28/webfontloader.js"></script>
<script>
        const parser = new AsciiMathParser();
        document.addEventListener("DOMContentLoaded", function () {
            const mathExprs = document.querySelectorAll('math-expr');
    
            mathExprs.forEach(function (element) {
                var expr = element.getAttribute('expr');
                const span = document.createElement('span');
                if (!expr.includes("\\\\displaystyle")) {
                    var expr = parser.parse(expr);
                }
                katex.render(expr, span, {
                    throwOnError: false,
                });
                
                element.appendChild(span);
            });
        });
</script>
</head>
`
