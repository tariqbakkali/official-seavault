SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict fWhb9eOVte6AAOQQOytCdPplNUQ3bLKVLYajZMnkzGvz66fBb5yXuDIGhYw1qEW

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: achievements; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."achievements" ("id", "code", "name", "description", "category", "icon_name", "points", "created_at") VALUES
	('1c8e4112-4a3f-4639-afe5-c8d0563ce9f5', 'getting_feet_wet', 'Getting Your Feet Wet', 'Log 5 different species', 'beginner', 'Fish', 50, '2025-03-15 14:27:09.769371+00'),
	('39f92a8b-bf37-4060-8e1f-7c397b69e0b9', 'underwater_explorer', 'Underwater Explorer', 'Log 10 different species', 'beginner', 'Trophy', 50, '2025-03-15 14:27:09.769371+00'),
	('525cad23-c51a-4d49-bbb0-e6797136d0cd', 'sea_vault_master', 'Sea Vault Master', 'Log 100 different species', 'collection', 'Medal', 500, '2025-03-15 14:27:09.769371+00'),
	('5c243d26-5f6b-4e15-9eaf-f38b00776175', 'shark_whisperer', 'Shark Whisperer', 'Log any species of shark', 'rare', 'Swords', 75, '2025-03-15 14:27:09.769371+00'),
	('7c06c6fc-d919-4b22-b64f-b03b6e36b5c9', 'elusive_spotter', 'Elusive Spotter', 'Log a rare species', 'rare', 'Star', 100, '2025-03-15 14:27:09.769371+00'),
	('82f3fcb9-2943-407b-b022-af3461b51fb6', 'first_catch', 'First Catch', 'Log your first marine animal', 'beginner', 'Trophy', 20, '2025-03-15 14:27:09.769371+00'),
	('942132e2-bb7a-4a14-a260-5a2022df8918', 'dolphin_friend', 'Dolphin Friend', 'Log any species of dolphin', 'rare', 'Heart', 75, '2025-03-15 14:27:09.769371+00'),
	('960c4f46-87f9-4b18-b844-7fd0b172cb58', 'whale_watcher', 'Whale Watcher', 'Log any whale species', 'rare', 'Whale', 100, '2025-03-15 14:27:09.769371+00'),
	('a7682fc3-8d25-4dbe-815a-ada53d69e0b0', 'ocean_archivist', 'Ocean Archivist', 'Log 50 different species', 'collection', 'Medal', 200, '2025-03-15 14:27:09.769371+00'),
	('c7746aaa-91df-43cf-939a-5f258103366a', 'marine_enthusiast', 'Marine Enthusiast', 'Log 25 different species', 'collection', 'Medal', 100, '2025-03-15 14:27:09.769371+00'),
	('ef637313-e774-4c4d-bd1c-623eacccf5de', 'manta_mania', 'Manta Mania', 'Log a manta ray', 'rare', 'Fish', 75, '2025-03-15 14:27:09.769371+00');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."categories" ("id", "name", "created_at", "image_url") VALUES
	('1ca46368-4dfb-4109-bbad-8a0ff3f0bcc2', 'Coral', '2025-03-26 18:51:31.050286+00', 'https://images.pexels.com/photos/3204595/pexels-photo-3204595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'),
	('48169dbe-0f42-4059-a6fb-842184ae60e2', 'Turtles', '2025-02-28 17:23:07.071451+00', 'https://images.pexels.com/photos/2397653/pexels-photo-2397653.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'),
	('4fe5e0c2-d60d-49d2-9854-ed7bde02ec63', 'Rays', '2025-02-28 17:23:07.071451+00', 'https://images.pexels.com/photos/5277697/pexels-photo-5277697.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'),
	('50d44a97-ec72-4c4f-9f66-e41c1621ded5', 'Reef Fish', '2025-02-28 17:23:07.071451+00', 'https://images.pexels.com/photos/3361052/pexels-photo-3361052.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'),
	('8521027a-5572-430a-881a-1a72835622f9', 'Fish', '2025-09-16 14:06:54.824873+00', 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
	('8d2f3964-9332-4032-9bc1-815e3f72836b', 'Cephalopods', '2025-02-28 17:23:07.071451+00', 'https://images.pexels.com/photos/9718224/pexels-photo-9718224.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'),
	('b7c83fd5-3729-4620-92e5-a3a6452300f5', 'Sharks', '2025-02-28 17:23:07.071451+00', 'https://images.pexels.com/photos/18659794/pexels-photo-18659794/free-photo-of-shark-swimming-in-a-sea.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'),
	('bdc2d112-78b2-47d6-9181-8e5ba48d7d7c', 'Mammals', '2025-02-28 17:23:07.071451+00', 'https://images.pexels.com/photos/26045508/pexels-photo-26045508/free-photo-of-undersea-view-of-a-pod-of-dolphins.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2');


--
-- Data for Name: creatures; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."creatures" ("id", "creature_id", "name", "scientific_name", "category_id", "points", "description", "habitat", "diet", "depth_range", "length", "weight", "lifespan", "image_url", "created_at", "class") VALUES
	('22fd9313-954d-45f7-841c-e480e638b1b5', '34915cc8-c698-4756-8366-58e5f4f93c7e', 'French Angelfish', 'Pomacanthus paru', '8521027a-5572-430a-881a-1a72835622f9', 100, 'Dark body with yellow-edged scales and bright yellow eye ring; often seen in pairs', 'Western Atlantic coral and rocky reefs', 'Sponges, algae, soft corals', '2–100 meters', 'Up to 41 cm', 'Around 1–1.4 kg', '10–15 years', 'https://upload.wikimedia.org/wikipedia/commons/8/83/Pomacanthus_paru_430514191.jpg', '2025-09-16 14:09:15.626673+00', 'Common'),
	('28d53df0-2600-4824-a49c-8cc02cb2b4b1', '5005574b-0747-46c4-abe4-b44fec6bced1', 'Blue Whale', 'Balaenoptera musculus', 'bdc2d112-78b2-47d6-9181-8e5ba48d7d7c', 500, 'The blue whale is the largest animal known to have ever existed.', 'Open ocean', 'Krill', '0-500m', 'Up to 30m', 'Up to 200 tons', '80-90 years', 'https://images.pexels.com/photos/4696771/pexels-photo-4696771.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', '2025-03-03 18:19:05.567585+00', 'Common'),
	('30aa90ae-d498-451c-9b51-a6a5448031c5', '001', 'Great White Shark', 'Carcharodon carcharias', 'b7c83fd5-3729-4620-92e5-a3a6452300f5', 900, 'The great white shark is a species of large mackerel shark which can be found in the coastal surface waters of all the major oceans.', 'Coastal and offshore waters', 'Carnivore - primarily seals, sea lions, and small whales', '0-1200m', 'Up to 6.1m', 'Up to 1,905kg', '70+ years', 'https://images.pexels.com/photos/15539380/pexels-photo-15539380/free-photo-of-a-great-white-shark-swimming-in-the-ocean.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', '2025-02-28 17:23:07.071451+00', 'Common'),
	('3a3da92c-9860-4a20-8ded-ccf2f3d311e9', '44e581d8-6d82-41df-90d1-ee8eb731321c', 'Octopus', NULL, '8d2f3964-9332-4032-9bc1-815e3f72836b', 200, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://images.pexels.com/photos/3046629/pexels-photo-3046629.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', '2025-03-03 18:19:05.567585+00', 'Common'),
	('3fedcccf-74b7-4b85-b495-8bc59d9c1e05', 'a02d61cd-b6eb-4bbe-a81b-11b652baa62b', 'Rainbow Runner', 'Elagatis bipinnulata', '8521027a-5572-430a-881a-1a72835622f9', 100, 'Streamlined body with blue-green back and yellow lateral stripes; fast swimmer, commonly found in schools', 'Open ocean (pelagic), often near reefs and around drifting objects', 'Small fish, squid, and crustaceans', 'Surface to ~150 meters', 'Up to 1.2 meters', 'Up to 15 kg', '4–5 years', 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Elagatis_bipinnulata.jpg', '2025-09-16 14:09:15.626673+00', 'Common'),
	('4b95fc0c-c0a4-44f1-a16d-36a2768fd974', 'ed4aa8ac-9782-457b-ab30-45b2bada3417', 'Bull Shark', NULL, 'b7c83fd5-3729-4620-92e5-a3a6452300f5', 200, 'The bull shark is a stocky, powerful shark known for its adaptability to both saltwater and freshwater environments. It has a broad, flat snout, small eyes, and a robust body, giving it a thick, muscular appearance. ', NULL, NULL, NULL, NULL, NULL, NULL, 'https://images.pexels.com/photos/6927443/pexels-photo-6927443.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', '2025-03-03 16:19:35.89295+00', 'Rare'),
	('6d79c680-7cc3-48e4-bf72-f8d152c342e9', '8b9ce863-fa58-4933-8e01-c3cf81b13abc', 'Tiger Shark', 'Galeocerdo cuvier', 'b7c83fd5-3729-4620-92e5-a3a6452300f5', 100, 'Named for its striped pattern, the tiger shark is a highly adaptable predator that eats a wide range of marine life.', NULL, NULL, NULL, NULL, NULL, NULL, 'https://images.pexels.com/photos/18558758/pexels-photo-18558758/free-photo-of-underwater-picture-of-a-great-white-shark.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', '2025-03-03 15:22:16.53772+00', 'Common'),
	('6f53cd50-be64-47a7-b048-107b232ba369', '1cac4135-e601-47f1-96ba-8a6cdb9cc2b6', 'Rock Beauty', 'Holacanthus tricolor', '8521027a-5572-430a-881a-1a72835622f9', 100, 'Bright yellow front with dark blue-black rear; small, bold, and territorial', 'Atlantic coral and rocky reefs', 'Sponges, algae', '3–92 meters', 'Up to 25 cm', 'Around 0.3–0.5 kg', '10–15 years', 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Biscayne_National_Park_H-rock_beauty_on_reef.jpg', '2025-09-16 14:09:15.626673+00', 'Common'),
	('77b8b77e-41fe-4efd-a527-e28e30c93b17', '2be2f0fb-debc-470f-bd27-9cbe7a0e7063', 'Queen Angelfish', 'holacanthus ciliaris', '8521027a-5572-430a-881a-1a72835622f9', 100, 'Vibrant blue and yellow body with a crown-like spot on the head; solitary and graceful swimmer', 'coral reefs in the western atllantic and caribbean', 'sponges,algae,tunicates', '1-70 meters', 'up to45 cm', 'Around1-1.6 kg', '15years', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Holacanthus_ciliaris%2C_Caribe.jpg/960px-Holacanthus_ciliaris%2C_Caribe.jpg?20140927121505', '2025-09-16 14:09:15.626673+00', 'Common'),
	('7da44518-4c3a-4bc5-a44e-a2073d331c0d', '720d1971-f2ff-43e4-9918-cddbe974a659', 'Reef Butterflyfish', 'Chaetodon sedentarius', '8521027a-5572-430a-881a-1a72835622f9', 100, 'Silvery body with narrow vertical bars and a black eye stripe; often seen in pairs, close to reefs', 'Western Atlantic coral reefs, especially in shallow waters', 'Small invertebrates, coral polyps, algae', '2–60 meters', 'Up to 15 cm', 'Around 0.1–0.2 kg', '5–7 years', 'https://upload.wikimedia.org/wikipedia/commons/3/30/Melon_Butterflyfish_In_Acropora_Coral_%2838797562144%29.jpg', '2025-09-16 14:09:15.626673+00', 'Common'),
	('802ed0c6-3d09-41ba-afa5-f5012a93203d', '004', 'Bottlenose Dolphin', 'Tursiops truncatus', 'bdc2d112-78b2-47d6-9181-8e5ba48d7d7c', 500, 'Bottlenose dolphins are the most common members of the family Delphinidae, the family of oceanic dolphins. They are widespread, and can be found in most tropical and temperate oceans.', 'Coastal and offshore waters', 'Carnivore - primarily fish and squid', '0-300m', 'Up to 4m', 'Up to 650kg', '40-60 years', 'https://images.pexels.com/photos/64219/dolphin-marine-mammals-water-sea-64219.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', '2025-02-28 17:23:07.071451+00', 'Common'),
	('8275b368-f617-44e0-b99e-3729c472909f', '4cbb6852-f008-4197-8bf4-0d8a7288e346', 'Blue Tang', 'Acanthurus coeruleus', '8521027a-5572-430a-881a-1a72835622f9', 100, 'Bright blue body with a yellow tail in juveniles (entirely blue in adults); known for its sharp caudal spine and active grazing behavior', 'Western Atlantic coral reefs and seagrass beds', 'Algae', '2–40 meters', 'Up to 39 cm', 'Around 0.6–1.0 kg', '8–20 years', 'https://upload.wikimedia.org/wikipedia/commons/2/24/Blue_Tang_Davis_Reef_20230712.jpg', '2025-09-16 14:09:15.626673+00', 'Common'),
	('91ae9a26-cf54-4039-aed1-316bd6160059', '6e837c33-ca7f-415d-bae0-e856e18b7345', 'Dolphinfish', 'Coryphaena hippurus', '8521027a-5572-430a-881a-1a72835622f9', 100, 'Brightly colored with iridescent blues, greens, and gold; fast-growing, migratory predator known for acrobatic jumps and swift swimming', 'Warm open ocean (pelagic zones) in tropical and subtropical waters', 'Fish, squid, crustaceans', 'Surface to ~85 meters', 'Up to 1.5 meters', 'Up to 18–30 kg', '4–5 years', 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Coryphaena_hippurus.PNG', '2025-09-16 14:09:15.626673+00', 'Common'),
	('97a7b7db-9c60-4286-b7b9-c2af1668a119', '2bf1a690-6737-4f6d-a33f-d6e6d8b431e5', 'Banded butterflyfish', 'Chaetodon striatus', '8521027a-5572-430a-881a-1a72835622f9', 100, 'White body with vertical black bands and a distinctive black eye bar; usually seen in pairs', 'Western Atlantic coral reefs and rocky coastal areas', 'Small invertebrates, coral polyps, worms', '2–20 meters', 'Up to 16 cm', 'Around 0.1–0.2 kg', '5–7 years', 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Chaetodon_striatus%2C_NOAA.jpg', '2025-09-16 14:09:15.626673+00', 'Common'),
	('9f3043a5-094c-4c67-a511-3d9dd6d06c79', '0af6df68-cd79-4e77-9399-8444611c4a76', 'Bigeye Scad', 'Selar crumenophthalmus', '8521027a-5572-430a-881a-1a72835622f9', 100, 'Slender, silvery body with large eyes and a forked tail; forms large schools, especially at night', 'Coastal and offshore waters, near reefs and islands', 'Zooplankton, small crustaceans, and fish larvae', 'Surface to ~170 meters', 'Up to 30 cm', 'Around 0.2–0.4 kg', '4–5 years', 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Selar_crumenophthalmus_by_NPS.jpg', '2025-09-16 14:09:15.626673+00', 'Common'),
	('ae3fc10b-6ebe-45a5-a1c7-f439caa58ac8', '1bb8963f-afd0-4666-8a42-1666e86c3f85', 'Spotfin Butterflyfish', 'Chaetodon ocellatus', '8521027a-5572-430a-881a-1a72835622f9', 100, 'Bright white body with yellow fins, vertical black eye bar, and a distinctive black spot near the dorsal fin', 'Western Atlantic coral reefs and shallow coastal waters', 'Small invertebrates, coral polyps, plankton', '2–60 meters', 'Up to 20 cm', 'Around 0.2–0.3 kg', '7–10 years', 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Chaetodon_ocellatus.jpg', '2025-09-16 14:09:15.626673+00', 'Common'),
	('baac973c-ec0c-45c3-9165-fd7e4bad6fc9', 'da455f5f-bc1f-439b-bcf6-2f52d934f5f3', 'Blue Angelfish', 'Holacanthus bermudensis', '8521027a-5572-430a-881a-1a72835622f9', 100, 'Blue-green body with yellow accents and no crown spot; often confused with the queen angelfish', 'Western Atlantic coral and rocky reefs', 'Sponges, algae, tunicates', '2–92 meters', 'Up to 45 cm', 'Around 1–1.5 kg', '20 years', 'https://upload.wikimedia.org/wikipedia/commons/d/da/Holacanthus_bermudensis.jpg', '2025-09-16 14:09:15.626673+00', 'Common'),
	('c218e0f4-9659-4daf-8b38-b9e3aee0c7ae', '6e0e8a5e-0257-488b-8f65-01fdca48d9b4', 'Ocean Surgeonfish', 'Acanthurus bahianus', '8521027a-5572-430a-881a-1a72835622f9', 100, 'Brown to bluish-gray body with a pale horizontal stripe and sharp spine near the tail; swims in schools and helps control algae growth on reefs', 'Western Atlantic coral reefs, rocky coasts, and seagrass beds', 'Algae, detritus', '2–40 meters', 'Up to 35 cm', 'Around 0.5–0.9 kg', '8–15 years', 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Ocean_Surgeonfish_Molasses_Reef_20080309.jpg', '2025-09-16 14:09:15.626673+00', 'Common'),
	('c61fe54e-068c-415d-ac53-8595f0efc9b1', '059ed083-6b46-4e99-815c-1c595d04247d', 'Doctorfish', 'Acanthurus chirurgus', '8521027a-5572-430a-881a-1a72835622f9', 100, 'Grayish body with 10–12 vertical bars and a sharp scalpel-like spine at the base of the tail; active grazer, often in schools', 'Western Atlantic coral reefs, rocky shores, and seagrass areas', 'Algae', '2–60 meters', 'Up to 38 cm', 'Around 0.6–1.2 kg', '10–15 years', 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Gfp-doctorfish.jpg', '2025-09-16 14:09:15.626673+00', 'Common'),
	('c976027d-476a-430a-97ce-0a3c7de7ed1f', 'c86044d5-3945-4f80-b295-e55119133cda', 'Foureye Butterflyfish', 'Chaetodon capistratus', '8521027a-5572-430a-881a-1a72835622f9', 100, 'Pale body with a dark vertical bar through the eye and a large false eyespot near the tail; often found in pairs', 'Western Atlantic coral reefs and seagrass beds', 'Coral polyps, worms, small invertebrates', '2–20 meters', 'Up to 15 cm', 'Around 0.1–0.2 kg', '5–7 years', 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Chaetodon_capistratus%2C_Caribe.jpg', '2025-09-16 14:09:15.626673+00', 'Common'),
	('dbc8a507-15ae-4227-93ef-054847f0e636', '005', 'Manta Ray', 'Mobula birostris', '4fe5e0c2-d60d-49d2-9854-ed7bde02ec63', 250, 'Manta rays are large rays belonging to the genus Mobula. They are circumglobal and are typically found in tropical and subtropical waters.', 'Tropical and subtropical waters', 'Filter feeder - primarily zooplankton', '0-120m', 'Up to 7m wingspan', 'Up to 1,350kg', '40+ years', 'https://images.pexels.com/photos/6565102/pexels-photo-6565102.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', '2025-02-28 17:23:07.071451+00', 'Common'),
	('e2d01ae0-ae39-45e5-80b9-ffdf88742a3d', '002', 'Green Sea Turtle', 'Chelonia mydas', '48169dbe-0f42-4059-a6fb-842184ae60e2', 200, 'The green sea turtle is a large sea turtle and a member of the family Cheloniidae. Its distribution extends throughout tropical and subtropical seas around the world.', 'Tropical and subtropical seas', 'Herbivore - primarily seagrasses and algae', '0-40m', 'Up to 1.5m', 'Up to 315kg', '80+ years', 'https://images.pexels.com/photos/20443161/pexels-photo-20443161/free-photo-of-photo-of-a-sea-turtle.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', '2025-02-28 17:23:07.071451+00', 'Common'),
	('e689ae98-2f70-4bfe-bc70-6fc0a98b4f96', '31037d20-99ab-4efb-b833-bd12b5f531fd', 'Gray Angelfish', 'Pomacanthus arcuatus', '8521027a-5572-430a-881a-1a72835622f9', 100, 'Gray body with a rounded profile and black-edged scales; juveniles are black with yellow stripes', 'Western Atlantic coral reefs and seagrass areas', 'Sponges, algae, tunicates', '2–30 meters', 'Up to 60 cm', 'Around 1.5–2.5 kg', '15 years', 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Pomacanthus_arcuatus_109580400.jpg', '2025-09-16 14:09:15.626673+00', 'Common'),
	('ef21bebe-49b7-4b88-aa7f-b60afd7bfc57', 'ab7ec9cc-f8c8-4787-b831-bd88cd75e73c', 'Townsend Angelfish', 'Holacanthus bermudensis(hybrid)', '8521027a-5572-430a-881a-1a72835622f9', 100, 'Hybrid of blue and queen angelfish; features traits of both, often with a faint crown spot and mixed coloration', 'Western Atlantic coral reefs', 'Sponges, algae, tunicates', '2–70 meters', 'Up to 45 cm', 'Around 1–1.5 kg', '15–20 years', 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Sanc040455403.jpg', '2025-09-16 14:09:15.626673+00', 'Common');


--
-- Data for Name: dive_sites; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."dive_sites" ("id", "name", "latitude", "longitude", "osm_id") VALUES
	('000c51a5-1670-479a-8370-6312c6ed896d', 'Kabelhaspels', 52.4509572, 4.8854407, 'node/5810586466'),
	('0020104e-7da5-4480-90fb-e0bbf24da601', 'Kerveli scouba diving', 37.7325497, 27.0360789, 'node/2547460303'),
	('00386b5f-556a-4bd0-883e-1f4b5c625a17', 'Sea Garden', -5.7350752, 106.606427, 'node/4111041437'),
	('0064deee-85f6-4953-945e-ec127375bfc9', '', 44.0235529, 8.2243628, 'node/767546793'),
	('006d1bcb-5370-475b-bba8-750872f6e519', '', 52.5405224, 6.1011543, 'node/6528248094'),
	('00846d32-d111-4389-a85b-9862703a814d', 'Champlain II', 44.206, -73.376333, 'node/663869520'),
	('00855af2-3dfd-454f-beba-a513cfda7e75', 'Vaageli Faru', 3.949542, 73.356496, 'node/663869921'),
	('008c47b7-526a-4b39-86a1-a601671d3e10', '', 51.3339669, 8.2589074, 'node/663870566'),
	('00994167-ff84-4b9e-8673-eef5f23ae28b', '', 52.4592651, 13.1124777, 'node/5818195686'),
	('00aeee4f-e59e-4433-b565-60b9d9298179', 'Tauchcenter Dresden', 51.008706, 13.8301413, 'node/4323878489'),
	('00b29c4e-0936-440f-8ff2-f213f8d7ee4f', 'Saugbagger Sandtrans', 54.4131667, 12.4123333, 'node/663871119'),
	('00b423df-802f-4fd3-a40f-8108bfb0e839', 'Portsea Hole', -38.3116785, 144.7116777, 'node/663869642'),
	('00bd5cfc-ca1c-47da-8a31-8da678d31ae6', 'Constandis', 34.6801605, 33.0845713, 'node/9451291573'),
	('00ee1e48-5822-45f6-833e-809861f5d0c8', 'Lighthouse Point', 12.1139501, -68.2952067, 'node/663869398'),
	('00ef911b-22e3-4b63-ba44-aa50aa17767c', 'Napoleon Reef', 28.471104, 34.509963, 'node/663869864'),
	('01069602-5858-4440-bef8-01774061043a', 'Exit 10', 3.6338652, 72.9609627, 'node/519024096'),
	('0111e2a2-c64a-4cf8-b873-11db307938df', '', 51.6805, 3.83577, 'node/838074356'),
	('0116424f-813e-489b-ae5a-ccc4e127679c', 'Linthkanal Ausstieg', 47.2243278, 8.984075, 'node/665087342'),
	('01286c48-2e22-4a81-bbe3-3adddde5e57a', 'Old Jetty Wreck', 10.619907, 103.3023588, 'node/3651013790'),
	('01575c3c-3b7b-4cee-8f51-89b42f669ccf', 'Kiesloch Zerben', 52.3669833, 11.9380667, 'node/663870929'),
	('017c66b4-518b-41c9-944a-5155431ea4a6', '', 7.6770733, 98.7617964, 'node/9526185417'),
	('0180176d-1cc4-4fae-a400-17c01be57b53', 'Ponza Diving Center', 40.8942588, 12.9651662, 'node/3609725539'),
	('0180a3ab-9102-4cae-9852-32443afd08c9', 'Raya', 8.6421457, 98.2513524, 'node/6172399375'),
	('01922c4c-c1b1-46d7-a7ab-bb56e8707de3', 'Holzlager', 47.0538304, 8.4275429, 'node/663870078'),
	('01989003-51c7-4b94-81a1-64530b413715', 'Aquarius', 12.0983883, -68.284795, 'node/663869409'),
	('01a145da-0657-4d3e-978f-ec84fe8046be', 'Punta des Murter', 40.0681714, 4.138814, 'node/9130386752'),
	('01ac4cf1-286c-428a-925c-c9a0044c0bf8', '', 26.237547, 127.3666046, 'node/600714113'),
	('01b3fb54-45b0-4e8f-b91c-40b71e88101c', 'Angel City', 12.1033916, -68.2872133, 'node/663869415'),
	('01b64ee4-23a2-45bc-a16d-e865b7c0189b', 'Koh Laun - Scuba Diving', 11.7843951, 102.3944143, 'node/7097921854'),
	('01bd6205-ad0e-43f5-a776-4511c5191b24', 'Jezioro Bielin', 52.837581, 14.435113, 'node/663871093'),
	('01cef8fd-2220-4110-8fa5-558395b4bc5e', 'Marxweiher', 49.4055, 8.4861667, 'node/663870534'),
	('01d1a27a-09bc-4618-b927-26b7b7910e93', 'Vertigo', 9.5929632, 138.1125339, 'node/4031013296'),
	('01d60bca-bd09-4d2b-b5ce-0abff2657b8e', 'Hausriff Zabargad Beach Resort', 24.2571, 35.4065333, 'node/663869770'),
	('01e34cf4-6e0c-442c-bfd3-4684812afa65', 'SMS Karlsruhe', 58.8895237, -3.1870727, 'node/406542586'),
	('01f20820-553a-4173-b122-2e8237781a7f', '', 9.1191188, 124.8065304, 'node/6961305585'),
	('0212d7f6-dd08-49cd-b9f2-20b6d53f9fc8', 'Bajo del Monstruo', 4.0086226, -81.6030341, 'node/7239667399'),
	('022310e1-d4fe-48a4-9ebc-470ae80c70ca', 'Jack''s Point', 12.6594722, 120.4441934, 'node/2674038379'),
	('022413a6-46c6-441a-a873-8bf6a80e04d7', 'Cave', 11.1536768, 119.279235, 'node/9865472184'),
	('022f76b7-e188-4e4d-8a26-fca4069173f7', '', -8.154344, 115.0282217, 'node/5671705735'),
	('02334454-fb68-47a6-9f06-a1794d252349', '', 51.9218, 5.43679, 'node/838074527'),
	('024acd86-21ff-4aaa-9ad5-f6ec250aac54', 'Bostalsee', 49.5652777, 7.0722222, 'node/663870487'),
	('024b670d-da0c-4ca4-ad76-56f139ddacb3', 'U-701 (Wrack)', 34.5, -74.55, 'node/663869494'),
	('0253972d-a2f1-4237-bcf3-2b7aada122ed', 'Billinghurst Cave', 36.0811776, 14.2354259, 'node/6239720385'),
	('02710cc3-2e08-474e-8176-f9a7914ecf08', '', 51.3808, 5.3329, 'node/838074499'),
	('02a79d69-f4d2-4710-b712-4f7102976986', 'Abu Galawa Kebir', 24.2286658, 35.5727769, 'node/663869765'),
	('02d9454e-00a6-45f9-b114-fc64e36af040', 'South Corner', 12.6546944, 120.4171666, 'node/2674038387'),
	('02dc06de-b11c-48f3-9fc3-e96739a1e1d5', 'Kleiner Brombachsee', 49.1327777, 10.8725, 'node/663870526'),
	('02ea5e4e-2184-44f1-8303-0b22152e83f5', 'Fulhidoo Caves', 3.683135, 73.417159, 'node/663869894'),
	('02f794e4-46a5-4996-8b39-598316a27706', 'Mike''s', 1.6351474, 124.7431438, 'node/7293794211'),
	('03058058-ee7e-4f98-bf8f-3d7a5048cd7b', 'Dibba Rock', 25.6034329, 56.3502417, 'node/9865803545'),
	('031da145-9e1e-4b60-88f3-5d9a05e07052', 'Centre de Plongée Souterraine', 44.5713252, 1.6943503, 'node/3842620651'),
	('0321d369-4a9f-48b4-95b0-cc9d80379a31', 'Carrière de Montulat', 46.2099941, 1.3378796, 'node/1983334434'),
	('035d70ed-266a-4299-abb4-c7cc8929ed4a', '', 9.0713047, 123.2672569, 'node/4552079523'),
	('035fb6a7-f7dc-415f-b38c-d2a8ddb7375f', 'Mouat Reef', 48.408333, -123.298333, 'node/663869289'),
	('03735019-a07c-4a0f-876f-74f8f611a274', 'Grote Knip', 12.3514337, -69.153211, 'node/447928253'),
	('0379d188-207f-48d3-acd5-4c7b3cdf356e', 'Pangas', 9.584901, 121.1937263, 'node/10672663106'),
	('037b36e8-8dac-4230-9c89-21e21ab3161d', 'Lao lao', -0.5038958, 130.718396, 'node/12167293760'),
	('0384b90d-f20b-458c-8145-d66a1e37e3d9', 'Brechtsee', 49.2177202, 8.4047528, 'node/291209539'),
	('038788a2-fdaf-4456-9788-c7120df1893c', 'Steinbruchsee Reitzenhain', 50.577832, 13.207427, 'node/663870875'),
	('03a31037-edb4-4f86-9dd1-24c831c7eb19', 'Vivian Quarry', 53.122765, -4.1138938, 'node/663869563'),
	('03bf5ebf-36c3-41b0-b60b-421b67aa2456', 'Schmitter Zoll Einstieg', 47.3933406, 9.6697598, 'node/665087346'),
	('03d4b887-55bb-4381-83b5-c43c486a7ccc', 'Kuter rybacki 1 (wrak)', 54.6821618, 18.6389026, 'node/3487751754'),
	('03e80f15-1c0c-4bd9-88ad-ca81a54ccb6a', 'Centro Immersioni Civitavecchia', 42.0636588, 11.813349, 'node/5002857125'),
	('03fd5d46-c21a-4ed9-a2ac-ad8cbfba11e3', 'SS Thistlegorm', 27.814092, 33.9200482, 'node/255316037'),
	('044e259f-06f5-4da7-9148-7de844292c7c', 'SMS Karlsruhe', 58.889724, -3.188334, 'node/663869619'),
	('044ef439-49c1-47a3-9d3f-01209c0ffedb', 'Lock 27', 44.7775281, -75.399561, 'node/7815068452'),
	('0468b1e9-2063-49c5-9baa-edf4bd3c6307', 'Tauchbasis Stechlinsee', 53.1508773, 13.0436005, 'node/8123389515'),
	('0479d12b-ac1b-4c7b-a7ad-dd7aac86292f', '', 21.999414, 120.7027458, 'node/945711062'),
	('0484d970-cd56-471e-b8fd-0b011e1e276e', 'Nemo', 26.7659865, 33.9432729, 'node/2613533331'),
	('04d21dd8-de2e-430e-a971-258e2e4056f9', 'Attersee - Alexenau', 47.87295, 13.5672166, 'node/663870828'),
	('04e014cc-e180-44d6-b4d9-59d6d52fafc3', 'Zootzensee', 53.1604, 12.8510667, 'node/663870989'),
	('04e80880-a7ac-42a5-ae4d-e805f9d05e41', 'Shark Ridge', 12.719804, 120.4874163, 'node/2674038384'),
	('04e9bf19-1309-4948-b071-2055df84ac23', 'Wolfgangsee', 47.7419181, 13.3904783, 'node/5749232697'),
	('0502a709-73fa-477d-a3ad-f43e75461b28', 'Beckenried Rütenen Einstieg 2', 46.9637825, 8.5106356, 'node/613753248'),
	('050e53cb-316c-4c67-9e25-2ce3e5d16792', 'princess alice bank', 38.4046516, -29.9476204, 'node/5875583620'),
	('05113f4a-533a-4b60-bc7b-22b2759eaa18', 'la Pota del Llop', 42.0493917, 3.2262165, 'node/791018588'),
	('051c4fbb-122d-4932-88e7-b78f4079ed98', 'Santorini Dive Center', 36.360858, 25.4028764, 'node/3820534628'),
	('0522e9dc-1936-40b5-8702-29adb7a7dde5', 'Dolfi Nord', 42.0442477, 3.2258048, 'node/791018624'),
	('05265b0f-a827-4438-aee3-25934e537d61', 'Walchensee - Galerie', 47.6061, 11.33545, 'node/663870679'),
	('0529974d-53ce-4572-a9bf-13eac49bd7e2', 'Ehem. Seepolizei)', 46.69602, 7.93617, 'node/663870044'),
	('0534c789-8e42-4746-bdf4-59a8d7c4cb45', 'Cliff', 12.1733517, -68.2894267, 'node/663869433'),
	('053e1a09-02d5-4526-94b7-e0b120f88778', 'Dive Central Gili', -8.3557311, 116.042323, 'node/2991853840'),
	('05522901-f329-4cca-b8f7-bada20d7cee8', 'Flying Sea Cliffs', 20.6304686, -156.4942032, 'node/3480272731'),
	('0554e26e-df64-4296-99c0-1f9074c474d7', '3 Rocks', 19.7727934, -70.5135665, 'node/270997627'),
	('05581514-12f7-4d2f-bcbd-32cac32a5567', 'Saxe Point', 48.423333, -123.418333, 'node/663869272'),
	('055a9c01-c853-4a34-b9f5-af85eed94fba', 'Middle Reef', 26.7050917, 34.0996195, 'node/6585137657'),
	('055ca867-3203-4d50-b0ba-8328aa678907', 'Nørresundby Sportsdykkerklub', 57.0565845, 9.9214613, 'node/4219240008'),
	('056dc444-27cb-44c7-927f-d049feefc7ff', 'Taucheinstieg 3', 51.4798212, 10.8125688, 'node/7671384191'),
	('057eaf3b-ae07-4b2e-950f-5beab4d361b6', 'Lhohi Faru Tila', 3.870622, 73.360051, 'node/663869906'),
	('05809270-57fb-49cc-91e7-bd08ec9606e5', 'Lago Maggiore-Centro Sub del Gambarogno', 46.13827, 8.81558, 'node/663870177'),
	('05816a13-7da8-4325-b744-58937cf66570', '大白沙潛水區', 22.6392711, 121.4929505, 'node/3776472537'),
	('058b96d5-17ce-4cc9-bdf0-996873f48dc3', 'Candia', 50.5716666, -0.5113888, 'node/663869550'),
	('059c2ebb-2b48-408b-a8af-a6db7a719e4b', 'Wai FPW', -0.7021871, 130.7126716, 'node/12182208860'),
	('05a26e4b-1326-42eb-ad47-42d9b5f44c83', '', -35.0821815, 150.7951128, 'node/950836637'),
	('05a3f8ba-821c-4168-915f-e8d5c3232b83', 'Tauchplatz Silbersee', 50.7145363, 8.0434692, 'node/12214096027'),
	('05b91a0c-7fb2-4e27-a313-bfd287714497', 'Luberweiher', 48.7841885, 13.0111395, 'node/663870856'),
	('05c065f5-4f8c-4b7c-b13e-c67ba3674a6a', 'Aquarius Diving Club', 27.19709, 33.8450664, 'node/11974012580'),
	('05e542a5-02a9-47cd-b48f-5364b22d4426', 'Schiffli', 47.325167, 8.575436, 'node/663452085'),
	('05e7469f-fa4b-4a1e-ab2b-75181f913615', 'Gwadive', 16.4178341, -61.5323129, 'node/6814682261'),
	('05f075f9-28e0-4091-a6a5-b3ceab3b9ad5', 'Tauchplatz Sipplingen', 47.7952161, 9.0949661, 'node/663870394'),
	('9b86578b-73cd-4a11-b7b4-f1c3e23be44d', 'ABC ', 51.83894549860686, 3.771862126886845, NULL),
	('5f230094-d576-4380-98de-1dad9d51abfd', 'Pakistan', 51.96685005091782, 5.05240973085165, NULL);


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "email", "full_name", "avatar_url", "membership_tier", "created_at", "is_premium", "has_seen_onboarding") VALUES
	('d1a50ea5-2d4f-4628-b0b8-1c52d91d3ff0', 'naeem.dev@gmail.com', 'Naeemul haq', 'https://hqqebvozpvwpopxtixyt.supabase.co/storage/v1/object/public/avatars/avatars/d1a50ea5-2d4f-4628-b0b8-1c52d91d3ff0/1758631674399.jpg/1758631674498-qick1lolpm.jpeg', NULL, '2025-09-23 11:16:22.790656+00', NULL, NULL),
	('d74293c1-7d97-4ab3-bb88-9676f6d09470', 'abx@gmail.com', 'fayaz', 'https://hqqebvozpvwpopxtixyt.supabase.co/storage/v1/object/public/avatars/avatars/d74293c1-7d97-4ab3-bb88-9676f6d09470/1758637388221.jpg/1758637388369-gmpd90zymri.jpeg', NULL, '2025-09-23 14:22:44.861308+00', false, false),
	('82d6229a-2890-416d-b66e-f626d38a5fe0', 'engr.sfashah@gmail.com', 'Fayaz', 'https://hqqebvozpvwpopxtixyt.supabase.co/storage/v1/object/public/avatars/avatars/82d6229a-2890-416d-b66e-f626d38a5fe0/1758688622242.jpg/1758688623820-muyb30qkup9.png', NULL, '2025-09-24 04:35:03.875854+00', NULL, NULL);


--
-- Data for Name: sightings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."sightings" ("id", "user_id", "creature_id", "date", "dive_notes", "image_url", "created_at", "dive_site_id", "dive_type", "time_of_day", "depth", "creature_notes") VALUES
	('96765b8c-a24b-47d2-bb34-8b402e3c84cc', '82d6229a-2890-416d-b66e-f626d38a5fe0', '28d53df0-2600-4824-a49c-8cc02cb2b4b1', '2025-09-24 00:00:00+00', 'What''s up ', 'file:///data/user/0/host.exp.exponent/cache/ImagePicker/64d63ec9-533e-4fec-8eee-f39bf7cc421f.jpeg', '2025-09-24 15:13:11.276251+00', '0554e26e-df64-4296-99c0-1f9074c474d7', 'night', '8:11 PM', '150', NULL),
	('f71bc894-e5d3-4c62-9fbb-405f86cacff7', '82d6229a-2890-416d-b66e-f626d38a5fe0', '3a3da92c-9860-4a20-8ded-ccf2f3d311e9', '2025-09-25 00:00:00+00', 'Hdhdnf', 'file:///data/user/0/host.exp.exponent/cache/ImagePicker/2c1920cc-b725-48c4-aa29-032ffee629f9.jpeg', '2025-09-26 10:47:57.365163+00', '01b3fb54-45b0-4e8f-b91c-40b71e88101c', 'Wreck', 'evening', '20', NULL),
	('6e7afd6c-9f0a-43a7-9311-d5c87c5dbcb1', 'd1a50ea5-2d4f-4628-b0b8-1c52d91d3ff0', '3a3da92c-9860-4a20-8ded-ccf2f3d311e9', '2025-09-28 00:00:00+00', 'Bxbxcnnc

', 'file:///data/user/0/host.exp.exponent/cache/ImagePicker/1d0e7b39-554e-4fef-9d2e-7e536ad0da26.jpeg', '2025-09-30 06:50:14.204514+00', '5f230094-d576-4380-98de-1dad9d51abfd', 'Wreck', 'morning', '200', NULL);


--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."wishlists" ("id", "user_id", "creature_id", "created_at") VALUES
	('34b75cbd-6eb9-45a5-beae-bd7286b19daa', '82d6229a-2890-416d-b66e-f626d38a5fe0', '3a3da92c-9860-4a20-8ded-ccf2f3d311e9', '2025-09-25 12:40:58.707852+00'),
	('7f141c0c-b788-4a6f-904d-395fa85a34fc', 'd1a50ea5-2d4f-4628-b0b8-1c52d91d3ff0', '3a3da92c-9860-4a20-8ded-ccf2f3d311e9', '2025-09-30 06:51:20.940575+00');


--
-- PostgreSQL database dump complete
--

-- \unrestrict fWhb9eOVte6AAOQQOytCdPplNUQ3bLKVLYajZMnkzGvz66fBb5yXuDIGhYw1qEW

RESET ALL;
