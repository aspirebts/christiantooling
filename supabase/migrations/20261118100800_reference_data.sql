-- =============================================================================
-- Reference data: practice categories, technology types and skills
-- =============================================================================
-- This is initial *data*, not application code: administrators can rename,
-- reorder, deactivate or add entries later. It lives in a migration (rather
-- than seed.sql, which only runs locally) so production receives it too.
-- Inserts are idempotent so re-running never overwrites admin edits.
-- =============================================================================

insert into public.practice_categories (slug, name, description, icon, sort_order) values
  ('prayer', 'Prayer', 'Personal and shared prayer, prayer lists, reminders and intercession.', 'hand-heart', 10),
  ('bible-reading', 'Bible Reading & Study', 'Reading plans, study tools, translations and commentaries.', 'book-open', 20),
  ('scripture-memory', 'Scripture Memory', 'Memorising and meditating on Scripture.', 'bookmark', 30),
  ('worship', 'Worship & Music', 'Worship planning, songs, chord charts and music resources.', 'music', 40),
  ('discipleship', 'Discipleship & Spiritual Growth', 'Mentoring, spiritual disciplines and growing in faith.', 'sprout', 50),
  ('fellowship', 'Fellowship & Community', 'Small groups, church community and staying connected.', 'users', 60),
  ('evangelism', 'Evangelism & Outreach', 'Sharing the gospel and serving neighbours with the good news.', 'megaphone', 70),
  ('giving', 'Giving & Generosity', 'Tithing, budgeting for generosity and supporting ministries.', 'hand-coins', 80),
  ('service', 'Service & Mission', 'Volunteering, missions and practical care for others.', 'heart-handshake', 90),
  ('fasting', 'Fasting', 'Guidance and companionship for seasons of fasting.', 'utensils-crossed', 100),
  ('rest', 'Rest & Sabbath', 'Sabbath rhythms, rest and healthy boundaries with technology.', 'sunrise', 110),
  ('reflection', 'Reflection & Journaling', 'Devotional journaling, examen and gratitude practices.', 'notebook-pen', 120),
  ('family', 'Family & Parenting', 'Faith at home, family devotions and resources for children.', 'house', 130),
  ('theology', 'Theology & Learning', 'Courses, theology resources and Christian education.', 'graduation-cap', 140),
  ('church-life', 'Church Life & Ministry', 'Tools that help churches and ministries serve well.', 'church', 150)
on conflict (slug) do nothing;

insert into public.technology_types (slug, name, description, icon, sort_order) values
  ('web-app', 'Web App', 'Runs in the browser on any device.', 'globe', 10),
  ('mobile-app', 'Mobile App', 'Native or installable app for phones and tablets.', 'smartphone', 20),
  ('desktop-app', 'Desktop App', 'Application for Windows, macOS or Linux.', 'monitor', 30),
  ('browser-extension', 'Browser Extension', 'Adds features to a web browser.', 'puzzle', 40),
  ('api-library', 'API & Developer Library', 'Building blocks for other developers.', 'code', 50),
  ('ai-assistant', 'AI Assistant', 'Conversational or AI-powered tool.', 'sparkles', 60),
  ('messaging-bot', 'Messaging Bot', 'Works inside chat apps, SMS or email.', 'message-square', 70),
  ('voice-assistant', 'Voice & Smart Speaker', 'Voice skills and smart speaker experiences.', 'mic', 80),
  ('audio-podcast', 'Audio & Podcast', 'Audio Bible, podcasts and listening experiences.', 'headphones', 90),
  ('wearable', 'Wearable', 'Smartwatch and wearable experiences.', 'watch', 100),
  ('website-resource', 'Website & Resource', 'Reference websites and online resources.', 'library', 110),
  ('open-dataset', 'Open Dataset', 'Openly licensed data for building tools.', 'database', 120)
on conflict (slug) do nothing;

insert into public.skills (slug, name, category, description, sort_order) values
  ('frontend-development', 'Frontend development', 'engineering', 'Building user interfaces for the web.', 10),
  ('backend-development', 'Backend development', 'engineering', 'APIs, databases and server-side systems.', 20),
  ('mobile-development', 'Mobile development', 'engineering', 'iOS, Android and cross-platform apps.', 30),
  ('devops', 'DevOps & infrastructure', 'engineering', 'Deployment, hosting, monitoring and reliability.', 40),
  ('data-analytics', 'Data & analytics', 'engineering', 'Data pipelines, analysis and reporting.', 50),
  ('ai-ml', 'AI & machine learning', 'engineering', 'Models, retrieval and AI-powered features.', 60),
  ('quality-assurance', 'Quality assurance & testing', 'engineering', 'Test planning, automation and release quality.', 70),
  ('security', 'Security', 'engineering', 'Application security reviews and hardening.', 80),
  ('ux-design', 'UX research & design', 'design', 'Understanding users and designing experiences.', 10),
  ('ui-design', 'Visual & UI design', 'design', 'Interface design, branding and illustration.', 20),
  ('accessibility', 'Accessibility', 'design', 'Making tools usable by everyone.', 30),
  ('product-management', 'Product management', 'product', 'Shaping what to build and why.', 10),
  ('project-management', 'Project management', 'product', 'Planning, coordination and delivery.', 20),
  ('technical-writing', 'Technical writing', 'content', 'Documentation and guides.', 10),
  ('copywriting', 'Copywriting', 'content', 'Clear, compelling product and marketing copy.', 20),
  ('translation', 'Translation & localisation', 'content', 'Bringing tools to more languages and cultures.', 30),
  ('theological-review', 'Theological review', 'ministry', 'Reviewing content for theological soundness.', 10),
  ('pastoral-advisory', 'Pastoral & ministry advisory', 'ministry', 'Ministry experience that keeps tools grounded in real needs.', 20),
  ('community-management', 'Community management', 'operations', 'Supporting volunteers and users.', 10),
  ('fundraising', 'Fundraising & partnerships', 'operations', 'Building support for the mission.', 20)
on conflict (slug) do nothing;
