setCoverInert(Boolean(document.getElementById("cover")));
applyGuestName();
applyAccents();
fitNames();
primeSpacedOrigins();


gsap.ticker.frame++;
playCoverIntro();
prepareHeroIntro();
cycleSlides(".lake__slide", 7000);
setupReel(setupGallery());
buildHeroScroll();
buildReveals();
buildLetter();
buildCouple();
buildStickers();
buildLanes();
buildStory();
buildTickets();
buildBunting();
buildLive();
buildQuote();
buildClosing();
buildSceneBackdrop();
pauseOffscreenLoops();
watchContentHeight();
setupMenu();
setupCalendar();
setupCountdown();
setupCalendarLink();
setupRsvp();
setupGift();
setupCountdownVideo();
setupMediaSlots();
setupGuestQR();
startCoverIntro();

document.getElementById("openInvitation").addEventListener("click", openInvitation);
document.getElementById("envelope").addEventListener("click", (event) => {
  if (!event.target.closest("#openInvitation")) openInvitation();
});
window.addEventListener("load", () => ScrollTrigger.refresh());
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
  fitNames();
  ScrollTrigger.refresh();
});
window.addEventListener("resize", fitNames);
