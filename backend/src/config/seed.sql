-- ============================================================
-- Dynamic Legal Lexicon — Seed Data
-- Run this AFTER migration.sql to populate sample data.
-- ============================================================

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
-- LEGAL TERMS
-- ========================
INSERT INTO terms_law_table (term, description, etymology, pronunciation) VALUES
('Habeas Corpus', 'A writ requiring a person under arrest to be brought before a judge or into court, especially to secure the person''s release unless lawful grounds are shown for their detention.', 'Latin: "you shall have the body"', 'hay-bee-uhs KOR-puhs'),
('Jurisdiction', 'The official power to make legal decisions and judgments. The extent of the power to make legal decisions, as defined by the territory, subject matter, or persons over which authority is exercised.', 'Latin: jurisdictio, from juris (law) + dictio (saying)', 'joor-is-DIK-shun'),
('Tort', 'A wrongful act, other than a breach of contract, that results in injury to another person''s body, property, reputation, or the like, and for which the injured party is entitled to compensation.', 'Old French: tort (wrong, injustice), from Latin tortum (twisted)', 'TORT'),
('Injunction', 'A judicial order that restrains a person or entity from beginning or continuing an action threatening or invading the legal right of another, or that compels a person to carry out a certain act.', 'Latin: injunctio (a command)', 'in-JUNGK-shun'),
('Bail', 'The temporary release of an accused person awaiting trial, sometimes on condition that a sum of money be lodged to guarantee their appearance in court.', 'Old French: baillier (to deliver, hand over)', 'BAYL'),
('Precedent', 'A previous case or legal decision that may be or must be followed in subsequent similar cases. It is a fundamental principle of common law systems.', 'Latin: praecedens (going before)', 'PREH-sih-dent'),
('Mens Rea', 'The intention or knowledge of wrongdoing that constitutes part of a crime, as opposed to the action or conduct of the accused. Often described as the "guilty mind."', 'Latin: "guilty mind"', 'MENZ REE-uh'),
('Stare Decisis', 'The legal principle of determining points in litigation according to precedent. Lower courts must follow decisions of higher courts within the same jurisdiction.', 'Latin: "to stand by things decided"', 'STAH-ree deh-SY-sis'),
('Due Process', 'Fair treatment through the normal judicial system, especially as a citizen''s entitlement. It ensures that legal proceedings are conducted fairly and that individuals are given notice and an opportunity to be heard.', 'From the Magna Carta and 14th Amendment of the U.S. Constitution', 'DOO PRAH-ses'),
('Writ', 'A form of written command in the name of a court or other legal authority to act, or abstain from acting, in some way.', 'Old English: writan (to write)', 'RIT'),
('Plaintiff', 'A person who brings a case against another in a court of law. Also known as a complainant or claimant in some jurisdictions.', 'Old French: plaintif (complaining)', 'PLAYN-tif'),
('Defendant', 'An individual, company, or institution sued or accused in a court of law. The party against whom a lawsuit is filed or charges are brought.', 'Latin: defendere (to ward off)', 'dih-FEN-dunt'),
('Affidavit', 'A written statement confirmed by oath or affirmation, for use as evidence in court. It is typically sworn before an authorized official such as a notary public.', 'Medieval Latin: affidavit ("he has stated on oath")', 'af-ih-DAY-vit'),
('Subpoena', 'A writ ordering a person to attend a court proceeding. Failure to comply with a subpoena can be punishable as contempt of court.', 'Latin: sub poena ("under penalty")', 'suh-PEE-nuh'),
('Statute of Limitations', 'A law that sets the maximum time after an event within which legal proceedings may be initiated. Once the period expires, the claim is typically barred.', 'From statutory law traditions', 'STA-choot uv lim-ih-TAY-shunz');

-- ========================
-- CASE LAW
-- ========================
INSERT INTO case_law_table (case_name, citation, court, year, summary, url) VALUES
('Maneka Gandhi v. Union of India', 'AIR 1978 SC 597', 'Supreme Court of India', 1978, 'Expanded the scope of Article 21 (Right to Life and Personal Liberty), establishing that any law depriving a person of personal liberty must be just, fair, and reasonable.', 'https://indiankanoon.org/doc/1766147/'),
('Kesavananda Bharati v. State of Kerala', 'AIR 1973 SC 1461', 'Supreme Court of India', 1973, 'Established the Basic Structure Doctrine, holding that Parliament cannot alter the basic structure of the Constitution through amendments.', 'https://indiankanoon.org/doc/257876/'),
('Vishaka v. State of Rajasthan', 'AIR 1997 SC 3011', 'Supreme Court of India', 1997, 'Laid down guidelines for prevention of sexual harassment at the workplace, which later led to the Sexual Harassment of Women at Workplace Act, 2013.', 'https://indiankanoon.org/doc/1031794/'),
('A.K. Gopalan v. State of Madras', 'AIR 1950 SC 27', 'Supreme Court of India', 1950, 'Early interpretation of preventive detention and personal liberty under Articles 19, 21, and 22 of the Constitution.', 'https://indiankanoon.org/doc/1857950/'),
('Olga Tellis v. Bombay Municipal Corporation', 'AIR 1986 SC 180', 'Supreme Court of India', 1985, 'Right to livelihood was held to be part of the right to life under Article 21. Pavement dwellers cannot be evicted without due process.', 'https://indiankanoon.org/doc/709776/'),
('State of West Bengal v. Anwar Ali Sarkar', 'AIR 1952 SC 75', 'Supreme Court of India', 1952, 'Discussed the scope of equal protection under Article 14, establishing that classification must be based on intelligible differentia.', 'https://indiankanoon.org/doc/100472/');

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
('Limitation Act, 1963', 'Section 3', 'Bar of limitation — every suit instituted after the period of limitation prescribed shall be dismissed.', 'https://indiankanoon.org/doc/1317393/');

-- ========================
-- TERM-CONTEXT MAPPINGS
-- ========================
INSERT INTO term_contexts (term_id, context_id, meaning) VALUES
-- Habeas Corpus
(1, 2, 'Used in criminal cases to challenge unlawful detention or imprisonment by the state.'),
(1, 3, 'A constitutional remedy under Article 226/32 to protect fundamental right to life and liberty.'),
-- Jurisdiction
(2, 1, 'Determines which civil court has authority to hear a dispute based on territorial limits, pecuniary value, or subject matter.'),
(2, 2, 'Determines which criminal court can try an offence based on where the offence was committed or where the accused resides.'),
(2, 8, 'Governs which country''s courts or international tribunals have authority over cross-border disputes.'),
-- Tort
(3, 1, 'A civil wrong for which the remedy is compensation/damages. Includes negligence, nuisance, defamation, and trespass.'),
-- Injunction
(4, 1, 'A court order preventing a party from doing an act (prohibitory) or compelling an act (mandatory) in civil disputes.'),
(4, 6, 'Used to prevent unauthorized construction, encroachment, or transfer of disputed property.'),
-- Bail
(5, 2, 'The release of an accused from custody upon furnishing a bond, ensuring appearance at trial. Types include regular bail, anticipatory bail, and interim bail.'),
-- Precedent
(6, 1, 'Prior judicial decisions that courts follow when deciding similar civil matters. Binding on lower courts.'),
(6, 2, 'Criminal case decisions by higher courts that establish principles for sentencing, bail, and procedural matters.'),
(6, 3, 'Constitutional bench decisions that establish fundamental interpretations of constitutional provisions.'),
-- Mens Rea
(7, 2, 'The mental element required to establish criminal liability — knowledge, intention, or recklessness.'),
-- Due Process
(9, 3, 'A constitutional principle ensuring that governmental actions follow fair procedures and do not arbitrarily deprive persons of life, liberty, or property.'),
(9, 7, 'Ensures administrative bodies follow principles of natural justice — no person shall be condemned unheard.');

-- ========================
-- TERM-CASES LINKS
-- ========================
INSERT INTO term_cases (term_id, case_id, relevance_note) VALUES
(1, 4, 'A.K. Gopalan case discussed the scope of habeas corpus in the context of preventive detention.'),
(1, 1, 'Maneka Gandhi case expanded the scope of personal liberty, directly relevant to habeas corpus petitions.'),
(9, 1, 'Maneka Gandhi v. Union of India established that due process is implicit in Article 21.'),
(9, 5, 'Olga Tellis case held that right to livelihood is part of due process under Article 21.'),
(2, 6, 'Anwar Ali Sarkar case dealt with jurisdictional aspects of special courts under Article 14.'),
(6, 2, 'Kesavananda Bharati established the Basic Structure Doctrine, a key constitutional precedent.'),
(4, 3, 'Vishaka guidelines involved mandatory injunctive directions against workplace sexual harassment.');

-- ========================
-- TERM-STATUTES LINKS
-- ========================
INSERT INTO term_statutes (term_id, statute_id, relevance_note) VALUES
(1, 4, 'Article 21 protects personal liberty — habeas corpus is the primary remedy when this right is violated.'),
(5, 2, 'Section 438 CrPC provides the procedure for anticipatory bail applications.'),
(7, 1, 'Section 302 IPC requires mens rea (intention to kill) for a murder conviction.'),
(9, 4, 'Article 21 has been interpreted to include due process of law through judicial pronouncements.'),
(9, 5, 'Article 14 ensures equal protection and non-arbitrary treatment — a component of due process.'),
(4, 6, 'Order XXXIX Rule 1 CPC empowers courts to grant temporary injunctions in civil cases.'),
(15, 7, 'Section 3 of the Limitation Act defines the bar of limitation for filing suits.');

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
(2, CURRENT_DATE + INTERVAL '6 days');
