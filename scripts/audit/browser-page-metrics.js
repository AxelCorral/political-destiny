/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI evaluates this file as a function expression. */

async (page) => {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number.parseFloat(style.opacity) > 0 &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const labelOf = (element) =>
      (
        element.getAttribute("aria-label") ||
        element.getAttribute("title") ||
        element.textContent ||
        element.getAttribute("name") ||
        element.id ||
        element.tagName
      )
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 100);
    const parseRgb = (value) => {
      const match = value.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/i);
      return match ? match.slice(1, 4).map(Number) : null;
    };
    const luminance = ([red, green, blue]) => {
      const channels = [red, green, blue].map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const contrastRatio = (foreground, background) => {
      const foregroundRgb = parseRgb(foreground);
      const backgroundRgb = parseRgb(background);
      if (!foregroundRgb || !backgroundRgb) return null;
      const first = luminance(foregroundRgb);
      const second = luminance(backgroundRgb);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };
    const resolvedBackground = (element) => {
      let current = element;
      while (current) {
        const value = getComputedStyle(current).backgroundColor;
        if (value && value !== "rgba(0, 0, 0, 0)" && value !== "transparent") return value;
        current = current.parentElement;
      }
      return "rgb(255, 255, 255)";
    };

    const interactive = [
      ...document.querySelectorAll(
        'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])',
      ),
    ].filter(visible);
    const smallTargets = interactive
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          element: element.tagName.toLowerCase(),
          label: labelOf(element),
          width: Math.round(rect.width * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
        };
      })
      .filter(({ width, height }) => width < 44 || height < 44);
    const formControls = [
      ...document.querySelectorAll('input:not([type="hidden"]), select, textarea'),
    ].filter(visible);
    const unlabeledControls = formControls
      .filter((element) => {
        const id = element.id;
        return !(
          element.getAttribute("aria-label") ||
          element.getAttribute("aria-labelledby") ||
          (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) ||
          element.closest("label")
        );
      })
      .map(labelOf);
    const missingAltImages = [...document.querySelectorAll("img")]
      .filter(visible)
      .filter((image) => !image.hasAttribute("alt"))
      .map(labelOf);

    const textElements = [...document.querySelectorAll("body *")].filter(
      (element) =>
        visible(element) &&
        [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim()),
    );
    const smallText = textElements
      .map((element) => ({
        label: labelOf(element),
        fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
      }))
      .filter(({ fontSize }) => fontSize < 14);
    const lowContrastText = textElements
      .map((element) => {
        const style = getComputedStyle(element);
        const fontSize = Number.parseFloat(style.fontSize);
        const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
        const ratio = contrastRatio(style.color, resolvedBackground(element));
        const threshold = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700) ? 3 : 4.5;
        return { label: labelOf(element), ratio, threshold, color: style.color };
      })
      .filter(({ ratio, threshold }) => ratio !== null && ratio < threshold);

    const duplicateIds = [...document.querySelectorAll("[id]")]
      .map((element) => element.id)
      .filter((id, index, ids) => ids.indexOf(id) !== index);
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
      .filter(visible)
      .map((heading) => ({ level: Number(heading.tagName.slice(1)), text: labelOf(heading) }));
    const animated = [...document.querySelectorAll("body *")].filter((element) => {
      if (!visible(element)) return false;
      const style = getComputedStyle(element);
      return style.animationName !== "none" || style.transitionDuration !== "0s";
    });

    return {
      url: location.href,
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
        viewportHeights: Number((document.documentElement.scrollHeight / innerHeight).toFixed(2)),
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      },
      accessibility: {
        interactiveCount: interactive.length,
        smallTargetCount: smallTargets.length,
        smallTargets: smallTargets.slice(0, 30),
        formControlCount: formControls.length,
        unlabeledControls,
        missingAltImages,
        duplicateIds: [...new Set(duplicateIds)],
        headings,
        landmarkCounts: {
          main: document.querySelectorAll("main").length,
          nav: document.querySelectorAll("nav").length,
          header: document.querySelectorAll("header").length,
          footer: document.querySelectorAll("footer").length,
        },
        smallTextCount: smallText.length,
        smallText: smallText.slice(0, 20),
        lowContrastTextCount: lowContrastText.length,
        lowContrastText: lowContrastText.slice(0, 20),
      },
      motion: {
        reducedMotionRequested: matchMedia("(prefers-reduced-motion: reduce)").matches,
        animatedElementCount: animated.length,
      },
      activeElement: labelOf(document.activeElement),
    };
  });
};
