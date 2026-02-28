-- ============================================================
-- Dynamic Legal Lexicon — Seed Data for Supabase
-- Run AFTER supabase_full_migration.sql
-- Uses ON CONFLICT DO NOTHING for safe re-runs.
-- ============================================================

-- ========================
-- LEGAL TERMS (oxford_definition + simplified_definition)
-- ========================
INSERT INTO terms_law_table (term, oxford_definition, simplified_definition) VALUES
('Habeas Corpus', 'A writ requiring a person under arrest to be brought before a judge or into court, especially to secure the person''s release unless lawful grounds are shown for their detention.', 'A legal order that says someone who is being held must be brought to court so a judge can decide if their detention is legal.'),
('Jurisdiction', 'The official power to make legal decisions and judgments. The extent of the power to make legal decisions, as defined by the territory, subject matter, or persons over which authority is exercised.', 'The authority of a court to hear and decide a case. It determines which court has the power over a particular dispute.'),
('Tort', 'A wrongful act, other than a breach of contract, that results in injury to another person''s body, property, reputation, or the like, and for which the injured party is entitled to compensation.', 'A wrong done to someone (not breaking a contract) that causes harm, and the person who was harmed can sue for money.'),
('Injunction', 'A judicial order that restrains a person or entity from beginning or continuing an action threatening or invading the legal right of another, or that compels a person to carry out a certain act.', 'A court order telling someone to stop doing something or to do something specific.'),
('Bail', 'The temporary release of an accused person awaiting trial, sometimes on condition that a sum of money be lodged to guarantee their appearance in court.', 'When an accused person is let out of jail before their trial, usually after paying money to promise they will come back to court.'),
('Precedent', 'A previous case or legal decision that may be or must be followed in subsequent similar cases. It is a fundamental principle of common law systems.', 'An earlier court decision that guides how judges should decide similar cases in the future.'),
('Mens Rea', 'The intention or knowledge of wrongdoing that constitutes part of a crime, as opposed to the action or conduct of the accused. Often described as the "guilty mind."', 'The mental state of intending to commit a crime — meaning the person knew what they were doing was wrong.'),
('Stare Decisis', 'The legal principle of determining points in litigation according to precedent. Lower courts must follow decisions of higher courts within the same jurisdiction.', 'The rule that courts should follow earlier decisions (precedents) when deciding similar cases.'),
('Due Process', 'Fair treatment through the normal judicial system, especially as a citizen''s entitlement. It ensures that legal proceedings are conducted fairly and that individuals are given notice and an opportunity to be heard.', 'The idea that everyone has the right to be treated fairly by the legal system, including the right to know the charges and be heard in court.'),
('Writ', 'A form of written command in the name of a court or other legal authority to act, or abstain from acting, in some way.', 'A formal written order issued by a court telling someone to do something or stop doing something.'),
('Plaintiff', 'A person who brings a case against another in a court of law. Also known as a complainant or claimant in some jurisdictions.', 'The person who files a lawsuit against someone else in court.'),
('Defendant', 'An individual, company, or institution sued or accused in a court of law. The party against whom a lawsuit is filed or charges are brought.', 'The person or organization being sued or charged with a crime in court.'),
('Affidavit', 'A written statement confirmed by oath or affirmation, for use as evidence in court. It is typically sworn before an authorized official such as a notary public.', 'A written statement that someone swears is true, used as evidence in court.'),
('Subpoena', 'A writ ordering a person to attend a court proceeding. Failure to comply with a subpoena can be punishable as contempt of court.', 'An official order requiring someone to appear in court or provide documents. Ignoring it can result in punishment.'),
('Statute of Limitations', 'A law that sets the maximum time after an event within which legal proceedings may be initiated. Once the period expires, the claim is typically barred.', 'A deadline for filing a lawsuit. If you wait too long after the event, you lose the right to sue.')
ON CONFLICT (term) DO NOTHING;

-- ========================
-- CONTEXTS
-- ========================
INSERT INTO contexts (name, description) VALUES
('Civil', 'Relating to civil law — disputes between individuals or organizations'),
('Criminal', 'Relating to criminal law — prosecution of offenses against the state'),
('Constitutional', 'Relating to constitutional law — fundamental rights and governance'),
('Corporate', 'Relating to corporate and business law'),
('Family', 'Relating to family law — marriage, divorce, custody'),
('Property', 'Relating to property and real estate law'),
('Administrative', 'Relating to administrative and regulatory law'),
('International', 'Relating to international law and treaties')
ON CONFLICT (name) DO NOTHING;

-- ========================
-- CASE LAW
-- ========================
INSERT INTO case_law_table (case_name, citation, court, year, summary, url) VALUES
('Maneka Gandhi v. Union of India', 'AIR 1978 SC 597', 'Supreme Court of India', 1978, 'Expanded the scope of Article 21 (Right to Life and Personal Liberty), establishing that any law depriving a person of personal liberty must be just, fair, and reasonable.', 'https://indiankanoon.org/doc/1766147/'),
('Kesavananda Bharati v. State of Kerala', 'AIR 1973 SC 1461', 'Supreme Court of India', 1973, 'Established the Basic Structure Doctrine, holding that Parliament cannot alter the basic structure of the Constitution through amendments.', 'https://indiankanoon.org/doc/257876/'),
('Vishaka v. State of Rajasthan', 'AIR 1997 SC 3011', 'Supreme Court of India', 1997, 'Laid down guidelines for prevention of sexual harassment at the workplace, which later led to the Sexual Harassment of Women at Workplace Act, 2013.', 'https://indiankanoon.org/doc/1031794/'),
('A.K. Gopalan v. State of Madras', 'AIR 1950 SC 27', 'Supreme Court of India', 1950, 'Early interpretation of preventive detention and personal liberty under Articles 19, 21, and 22 of the Constitution.', 'https://indiankanoon.org/doc/1857950/'),
('Olga Tellis v. Bombay Municipal Corporation', 'AIR 1986 SC 180', 'Supreme Court of India', 1985, 'Right to livelihood was held to be part of the right to life under Article 21. Pavement dwellers cannot be evicted without due process.', 'https://indiankanoon.org/doc/709776/'),
('State of West Bengal v. Anwar Ali Sarkar', 'AIR 1952 SC 75', 'Supreme Court of India', 1952, 'Discussed the scope of equal protection under Article 14, establishing that classification must be based on intelligible differentia.', 'https://indiankanoon.org/doc/100472/')
ON CONFLICT DO NOTHING;

-- ========================
-- STATUTES
-- ========================
INSERT INTO statutory_table (statute_name, section, description, url) VALUES
('Indian Penal Code, 1860', 'Section 302', 'Punishment for murder — whoever commits murder shall be punished with death or imprisonment for life and shall also be liable to fine.', 'https://indiankanoon.org/doc/1560742/'),
('Code of Criminal Procedure, 1973', 'Section 438', 'Direction for grant of anticipatory bail — when any person apprehends arrest, they may apply for anticipatory bail.', 'https://indiankanoon.org/doc/1722/'),
('Indian Evidence Act, 1872', 'Section 3', 'Defines key terms: "Court", "Fact", "Relevant", "Evidence", "Proved", "Disproved", and "Not Proved".', 'https://indiankanoon.org/doc/1953529/'),
('Constitution of India', 'Article 21', 'Protection of life and personal liberty — no person shall be deprived of his life or personal liberty except according to procedure established by law.', 'https://indiankanoon.org/doc/1199182/'),
('Constitution of India', 'Article 14', 'Right to equality — the State shall not deny to any person equality before the law or equal protection of the laws within the territory of India.', 'https://indiankanoon.org/doc/367586/'),
('Code of Civil Procedure, 1908', 'Order XXXIX Rule 1', 'Temporary injunctions — where property in dispute is in danger of waste, damage or alienation by any party.', 'https://indiankanoon.org/doc/1671654/'),
('Limitation Act, 1963', 'Section 3', 'Bar of limitation — every suit instituted after the period of limitation prescribed shall be dismissed.', 'https://indiankanoon.org/doc/1317393/')
ON CONFLICT DO NOTHING;

-- ========================
-- DAILY TERM (Term of the Day)
-- ========================
INSERT INTO daily_term (term_id, display_date) VALUES
(1, CURRENT_DATE),
(7, CURRENT_DATE + INTERVAL '1 day'),
(9, CURRENT_DATE + INTERVAL '2 days'),
(3, CURRENT_DATE + INTERVAL '3 days'),
(6, CURRENT_DATE + INTERVAL '4 days'),
(14, CURRENT_DATE + INTERVAL '5 days'),
(2, CURRENT_DATE + INTERVAL '6 days')
ON CONFLICT (display_date) DO NOTHING;
