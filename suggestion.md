# IAOS Connect — Improvement Suggestions

## Critical (Security & Reliability)

1. **Add rate limiting** — No rate limiting on any endpoint. Auth routes (login, register, forgot-password) are especially vulnerable to brute force. Use something like a middleware-based approach or edge rate limiting.

2. **Implement actual email delivery** — Password reset tokens are logged to console, making the feature non-functional in production. Integrate AWS SES (already on AWS) or Resend/SendGrid.

3. **Wire up email verification** — The `emailVerified` field exists in the schema and the UI shows a "Verified" badge, but nothing ever sets it to `true`. Complete the flow.

4. **Run tests in CI** — GitHub Actions workflow deploys directly without running tests. One bad push goes straight to production. Add a `pnpm test` step before deploy.

5. **Add database indexes** — No indexes defined in the schema. As data grows, queries on `users.email`, `articles.category`, `jobs.status`, `donations.campaignId` etc. will degrade.

---

## High (Functionality Gaps)

6. **Fix news sort** — The sort dropdown updates local state but never passes the parameter to the API. Users think they're sorting but get the same order.

7. **Fetch real profile stats** — `ProfileStats` shows hardcoded `jobPosted={0}` and `totalDonated="Rp0"` instead of querying actual data.

8. **Add pagination** — News, jobs, connections, and admin tables are all capped at a fixed limit with no "load more" or infinite scroll.

9. **Dynamic filter options** — Alumni directory company/expertise filters are hardcoded arrays. Pull these from the database so they stay current.

10. **Complete OAuth** — Google/Apple login buttons exist in the UI but are disabled. Either implement them or remove them to avoid confusing users.

---

## Medium (Developer Experience & Operations)

11. **Add error tracking** — No Sentry, no structured logging. When something breaks in production, there's no visibility.

12. **Expand test coverage** — Only auth routes have tests. News, jobs, donations, connections, profile, and admin APIs are completely untested.

13. **Multi-stage Dockerfile** — Current single-stage build produces a bloated image with devDependencies and source files. A multi-stage build would cut the image size significantly.

14. **Add a `.dockerignore`** — Prevent `node_modules`, `.git`, and other unnecessary files from being copied into the Docker build context.

---

## Lower (UX & Polish)

15. **Push notifications / real-time updates** — The notification system is pull-only. Consider web push notifications or SSE for real-time delivery.

16. **Offline support** — Styled as a PWA but has no service worker or offline caching. Adding basic offline support would help in low-connectivity areas.

17. **Image optimization** — S3 images are served via signed URLs with no resizing or CDN. Consider CloudFront + image transforms, or use Next.js `<Image>` with a custom loader.

18. **Accessibility audit** — Mobile-first apps often miss keyboard navigation and screen reader support. A pass with axe or Lighthouse would surface quick wins.

19. **Localization** — The app mixes Indonesian and English. Consider a proper i18n setup (e.g., `next-intl`) for consistency.

20. **Account lockout** — No protection against repeated failed login attempts. Add temporary lockout after N failures.

---

## Cool Features to Add

21. **Alumni World Map** — An interactive map showing where alumni are located around the globe. Each pin shows name, batch year, and current role. Gives the community a visual sense of how far the network reaches — oceanography grads working across continents.

22. **Mentorship Matching** — Let senior alumni opt in as mentors and juniors request mentorship by interest area (industry, academia, entrepreneurship). The app suggests matches based on career field and expertise. Turns passive networking into active career development.

23. **Events & Reunions** — A full event system with RSVP, calendar integration, and reminders. Support both online (Zoom links) and in-person events with location maps. Batch reunions, webinars, campus visits — all managed in-app instead of scattered across WhatsApp groups.

24. **Alumni Spotlight / Stories** — A featured section where alumni share their journey — career pivots, research breakthroughs, life abroad. Think mini blog posts or interview-style profiles. Builds pride in the community and gives younger alumni role models.

25. **Discussion Forum** — Threaded discussions organized by topic (career advice, research, campus nostalgia, industry news). More persistent and searchable than group chats. Could include batch-specific channels.

26. **Project Collaboration Board** — Alumni can post projects they need help with — research collaborations, startup co-founders, freelance gigs, volunteer work. Turns the network into a talent marketplace beyond just job listings.

27. **Polls & Voting** — Let the association run polls for decisions (event planning, board elections, budget allocation). Transparent, auditable, and way better than counting WhatsApp reactions.

28. **Achievement Feed** — Automatic or self-reported milestones: promotions, publications, company launches, certifications. A celebratory feed that keeps the community engaged and aware of each other's wins.

29. **Alumni Business Directory** — A searchable directory of alumni-owned businesses and services. Members can list their company with a description, category, and contact. Encourages the community to support each other's ventures.

30. **Batch Group Spaces** — Dedicated spaces per angkatan (batch year) with their own feed, photo albums, and member list. Recreates the intimacy of batch WhatsApp groups but with better media management and discoverability.
