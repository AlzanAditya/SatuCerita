function setupGift() {
  const toggle = document.getElementById("giftToggle");
  const content = document.getElementById("giftContent");
  const parcel = document.getElementById("giftParcel");
  if (toggle && content) {
    const toggleLabel = toggle.querySelector("span");
    toggle.addEventListener("click", () => {
      const willOpen = content.hidden;
      toggle.setAttribute("aria-expanded", String(willOpen));
      toggleLabel.textContent = willOpen ? I18N.giftHide : I18N.giftOpen;
      const cards = content.querySelectorAll(".bank, .parcel");
      const headings = content.querySelectorAll(".gift__heading");
      gsap.killTweensOf([content, ...cards, ...headings]);
      if (!willOpen) {
        if (parcel && !prefersReducedMotion) gsap.to(parcel, { scale: 1, opacity: 1, rotation: 0, duration: .8, ease: "back.out(1.6)" });
        gsap.to(content, { height: 0, opacity: 0, overflow: "hidden", duration: .6, ease: "power3.inOut", onComplete: () => { content.hidden = true; gsap.set(content, { clearProps: "all" }); ScrollTrigger.refresh(); } });
        return;
      }
      content.hidden = false;
      ScrollTrigger.refresh();
      if (prefersReducedMotion) return;
      if (parcel) {
        gsap.timeline()
          .to(parcel, { keyframes: { rotation: [0, -6, 5, -3, 0] }, duration: .5, ease: "none" })
          .to(parcel, { scale: .62, opacity: .55, duration: .6, ease: "power2.inOut" });
      }
      gsap.timeline()
        .from(headings, { opacity: 0, y: 14, duration: .8, stagger: .3, ease: "power3.out", clearProps: "transform,opacity" }, .2)
        .fromTo(cards, { y: 56, rotation: (index) => (index % 2 ? 2 : -2), scale: .965, opacity: 0 }, { y: 0, rotation: 0, scale: 1, opacity: 1, duration: 1.3, ease: "expo.out", stagger: .14, clearProps: "transform,opacity" }, .25);
      lenis.scrollTo(content, { offset: -120, duration: 1.4 });
    });
  }
  document.querySelectorAll("[data-copy]").forEach((button) => {
    const label = button.querySelector("span") || button.lastChild;
    const originalLabel = label.textContent;
    const value = button.hasAttribute("data-copy-compact") ? button.dataset.copy.replace(/[\s.-]/g, "") : button.dataset.copy;
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(value);
        label.textContent = I18N.copied;
      } catch {
        label.textContent = I18N.copyFailed;
      }
      setTimeout(() => { label.textContent = originalLabel; }, 1800);
    });
  });
}
