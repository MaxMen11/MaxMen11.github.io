document.body.style.display = "none"; // Hide body to prevent flickering
(function() {
    const path = window.location.pathname;
    const endsWithSlash = path.endsWith('/');
    const isRoot = path === '/';
    if (endsWithSlash && !isRoot) {
        window.location.replace(`${window.location.origin}${path}index.html${window.location.search}${window.location.hash}`);
    }
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has("lang")) {
        const metaTag = document.querySelector('meta[name="langer-conf"]');
        if (!metaTag) {
            document.body.style.display = "";
            return;
        }
        const langs = [...metaTag.attributes]
        .filter(attr => /-src$/.test(attr.name))
        .map(attr => attr.name.split("-")[0]);
        const browserLang = (navigator.language || "en").split("-")[0];
        const defaultLang = metaTag.getAttribute("defaultLang");
        const redirectLang = langs.includes(browserLang)
        ? browserLang
        : langs.includes(defaultLang)
        ? defaultLang
        : langs[0] || "en";
        const url = new URL(window.location.href);
        url.searchParams.set("lang", redirectLang);
        window.location.href = url.toString();
    }
})();
document.addEventListener("DOMContentLoaded", function () {
    setTimeout(async () => {
        const metaTag = document.querySelector('meta[name="langer-conf"]');
        if (!metaTag) return;
        // Extract available languages
        const o = [...metaTag.attributes]
            .filter(attr => /-src$/.test(attr.name))
            .map(attr => attr.name.split("-")[0]);
        // Determine the language
        const urlLang = new URLSearchParams(location.search).get("lang");
        const browserLang = (navigator.language || "en").split("-")[0];
        const defaultLang = metaTag.getAttribute("defaultLang");
        const selectedLang = o.includes(urlLang)
            ? urlLang
            : o.includes(browserLang)
            ? browserLang
            : o.includes(defaultLang)
            ? defaultLang
            : o[0] || "en";
        // Create a new meta tag for the selected language
        const langMeta = document.createElement("meta");
        const langSrc = metaTag.getAttribute(`${selectedLang}-src`);
        langMeta.name = "langer-set";
        langMeta.setAttribute("lang", selectedLang);
        langMeta.setAttribute("lang-src", langSrc);
        document.head.appendChild(langMeta);
        try {
            // Fetch translation file
            const response = await fetch(langSrc + "?_1=" + Date.now() + "&_2=" + Math.random());
            if (!response.ok) throw new Error(`No translation src file found.`);
            const translations = await response.json();
            // Clone the entire document to work on it in memory
            const docClone = document.cloneNode(true);
            const cssLink = document.createElement("link");
            cssLink.rel = "stylesheet";
            cssLink.href = "/css/langer.css";
            docClone.head.appendChild(cssLink);
            // Apply translations
            docClone.body.innerHTML = docClone.body.innerHTML.replace(
                /{={=(\w*):langer}}/g,
                (match, key) => translations[key] || (console.warn(`No translation found for key: ${key}`), match)
            );
            docClone.head.innerHTML = docClone.head.innerHTML.replace(
                /{={=(\w*):langer}}/g,
                (match, key) => translations[key] || (console.warn(`No translation found for key: ${key}`), match)
            );
            // Populate the custom language dropdown
            const langSelectId = metaTag.getAttribute("langSelectorId");
            const langDropdown = docClone.getElementById(langSelectId);
            if (langDropdown) {
                const currentLangDiv = document.createElement("div");
                currentLangDiv.className = "lang-current";
                currentLangDiv.textContent = selectedLang.toUpperCase();

                const optionsDiv = document.createElement("div");
                optionsDiv.className = "lang-options";
                optionsDiv.style.display = "none";

                o.forEach(lang => {
                    const langOption = document.createElement("div");
                    langOption.textContent = lang.toUpperCase();
                    langOption.setAttribute("data-lang", lang);
                    langOption.onclick = () => {
                        const url = new URL(window.location.href);
                        url.searchParams.set("lang", lang);
                        window.location.href = url.toString();
                    };
                    optionsDiv.appendChild(langOption);
                });

                currentLangDiv.onclick = () => {
                    optionsDiv.style.visibility = optionsDiv.style.visibility === "visible" ? "hidden" : "visible";
                };

                langDropdown.appendChild(currentLangDiv);
                langDropdown.appendChild(optionsDiv);
            }
            // Update anchor tags to include the lang parameter
            docClone.body.querySelectorAll('a').forEach(anchor => {
                const href = new URL(anchor.href);
                href.searchParams.set("lang", selectedLang); // Set lang parameter
                anchor.href = href.toString(); // Update the href
            });
            // Update anchor tags to for one to be selected if its in "nav li"
            try {
                const navLinks = docClone.body.querySelectorAll("nav li a");
                const currentPath = window.location.href;

                navLinks.forEach(link => {
                    if (link.getAttribute("href") === currentPath) {
                        link.classList.add("active");
                    }
                });
            } catch (e) {
                console.error("Failed to set active nav link:", e);
            }
            // Ensure body is visible before replacing it
            docClone.body.style.display = "";
            // Replace the body and head
            document.body.replaceWith(docClone.body);
            document.head.replaceWith(docClone.head);
            // Change html lang tag
            document.documentElement.lang = selectedLang;
        } catch (error) {
            console.error("Error loading translation:", error);
            document.body.style.display = ""; // Ensure body is visible even if there's an error
        }
    }, 100);
});
