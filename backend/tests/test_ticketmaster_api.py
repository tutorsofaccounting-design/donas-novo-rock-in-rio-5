"""
Ticketmaster Clone API Tests
Tests for events, venues, carousel, experiences, and destaques endpoints
Updated for iteration 4: New 'Destaques | São Paulo e Região' section with 9 events
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndRoot:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint returns message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root returns: {data['message']}")


class TestExperiencesEndpoint:
    """Tests for /api/experiences endpoint - 10 experiences matching Ticketmaster original"""
    
    def test_get_experiences_returns_10(self):
        """GET /api/experiences should return 10 experiences"""
        response = requests.get(f"{BASE_URL}/api/experiences")
        assert response.status_code == 200
        experiences = response.json()
        assert isinstance(experiences, list)
        assert len(experiences) == 10, f"Expected 10 experiences, got {len(experiences)}"
        print(f"✓ GET /api/experiences returns {len(experiences)} experiences")
    
    def test_experiences_correct_order(self):
        """Experiences should be in correct order: BBB, Manti, NBA, Oktoberfest, Toy Story, Roda Rico, Sampa Sky, College Football, UTS Rio, Casa Warner"""
        response = requests.get(f"{BASE_URL}/api/experiences")
        assert response.status_code == 200
        experiences = response.json()
        expected_titles = [
            "BBB Experience",
            "Manti Wine Sessions",
            "NBA House 2026",
            "São Paulo Oktoberfest 2026",
            "Toy Story Ao Infinito e Além: A Exposição",
            "Roda Rico",
            "Sampa Sky",
            "College Football",
            "UTS Rio 2026",
            "Casa Warner"
        ]
        actual_titles = [e['title'] for e in experiences]
        assert actual_titles == expected_titles, f"Order mismatch: {actual_titles}"
        print(f"✓ Experiences in correct order: {actual_titles}")
    
    def test_experiences_have_required_fields(self):
        """Each experience should have venue, title, city, dates, image, slug"""
        response = requests.get(f"{BASE_URL}/api/experiences")
        assert response.status_code == 200
        experiences = response.json()
        required_fields = ['venue', 'title', 'city', 'dates', 'image', 'slug']
        for exp in experiences:
            for field in required_fields:
                assert field in exp, f"Missing field '{field}' in experience {exp.get('title', 'unknown')}"
        print(f"✓ All {len(experiences)} experiences have required fields")
    
    def test_experiences_images_start_with_experiences_path(self):
        """All experience images should start with /experiences/"""
        response = requests.get(f"{BASE_URL}/api/experiences")
        assert response.status_code == 200
        experiences = response.json()
        for exp in experiences:
            assert exp['image'].startswith('/experiences/'), f"Image path should start with /experiences/: {exp['image']}"
        print(f"✓ All experience images have correct path prefix")
    
    def test_experiences_slugs_match_events(self):
        """All experience slugs should correspond to existing events"""
        response = requests.get(f"{BASE_URL}/api/experiences")
        assert response.status_code == 200
        experiences = response.json()
        expected_slugs = [
            "bbb-experience", "manti-wine-sessions", "nba-house-2026",
            "sp-oktoberfest-2026", "toy-story-exposicao", "roda-rico",
            "sampa-sky", "college-football", "uts-rio", "casa-warner"
        ]
        actual_slugs = [e['slug'] for e in experiences]
        assert actual_slugs == expected_slugs, f"Slug mismatch: {actual_slugs}"
        print(f"✓ Experience slugs correct: {actual_slugs}")


class TestExperienceEventPages:
    """Tests for new experience event detail pages"""
    
    def test_bbb_experience_event(self):
        """GET /api/events/bbb-experience should return BBB Experience event"""
        response = requests.get(f"{BASE_URL}/api/events/bbb-experience")
        assert response.status_code == 200
        event = response.json()
        assert event['slug'] == 'bbb-experience'
        assert 'BBB' in event['title']
        assert event['venue'] == 'ParkShopping São Caetano'
        print(f"✓ GET /api/events/bbb-experience returns: {event['title']}")
    
    def test_manti_wine_sessions_event(self):
        """GET /api/events/manti-wine-sessions should return Manti Wine Sessions event"""
        response = requests.get(f"{BASE_URL}/api/events/manti-wine-sessions")
        assert response.status_code == 200
        event = response.json()
        assert event['slug'] == 'manti-wine-sessions'
        assert 'MANTI' in event['title'].upper()
        print(f"✓ GET /api/events/manti-wine-sessions returns: {event['title']}")
    
    def test_nba_house_2026_event(self):
        """GET /api/events/nba-house-2026 should return NBA House 2026 event"""
        response = requests.get(f"{BASE_URL}/api/events/nba-house-2026")
        assert response.status_code == 200
        event = response.json()
        assert event['slug'] == 'nba-house-2026'
        assert 'NBA' in event['title']
        print(f"✓ GET /api/events/nba-house-2026 returns: {event['title']}")
    
    def test_sp_oktoberfest_2026_event(self):
        """GET /api/events/sp-oktoberfest-2026 should return São Paulo Oktoberfest event"""
        response = requests.get(f"{BASE_URL}/api/events/sp-oktoberfest-2026")
        assert response.status_code == 200
        event = response.json()
        assert event['slug'] == 'sp-oktoberfest-2026'
        assert 'OKTOBERFEST' in event['title'].upper()
        print(f"✓ GET /api/events/sp-oktoberfest-2026 returns: {event['title']}")
    
    def test_toy_story_exposicao_event(self):
        """GET /api/events/toy-story-exposicao should return Toy Story Exposição event"""
        response = requests.get(f"{BASE_URL}/api/events/toy-story-exposicao")
        assert response.status_code == 200
        event = response.json()
        assert event['slug'] == 'toy-story-exposicao'
        assert 'TOY STORY' in event['title'].upper()
        print(f"✓ GET /api/events/toy-story-exposicao returns: {event['title']}")
    
    def test_roda_rico_event(self):
        """GET /api/events/roda-rico should return Roda Rico event"""
        response = requests.get(f"{BASE_URL}/api/events/roda-rico")
        assert response.status_code == 200
        event = response.json()
        assert event['slug'] == 'roda-rico'
        assert 'RODA RICO' in event['title'].upper()
        print(f"✓ GET /api/events/roda-rico returns: {event['title']}")
    
    def test_sampa_sky_event(self):
        """GET /api/events/sampa-sky should return Sampa Sky event"""
        response = requests.get(f"{BASE_URL}/api/events/sampa-sky")
        assert response.status_code == 200
        event = response.json()
        assert event['slug'] == 'sampa-sky'
        assert 'SAMPA SKY' in event['title'].upper()
        print(f"✓ GET /api/events/sampa-sky returns: {event['title']}")
    
    def test_college_football_event(self):
        """GET /api/events/college-football should return College Football event"""
        response = requests.get(f"{BASE_URL}/api/events/college-football")
        assert response.status_code == 200
        event = response.json()
        assert event['slug'] == 'college-football'
        assert 'COLLEGE FOOTBALL' in event['title'].upper()
        print(f"✓ GET /api/events/college-football returns: {event['title']}")
    
    def test_uts_rio_event(self):
        """GET /api/events/uts-rio should return UTS Rio event (existing)"""
        response = requests.get(f"{BASE_URL}/api/events/uts-rio")
        assert response.status_code == 200
        event = response.json()
        assert event['slug'] == 'uts-rio'
        assert 'UTS' in event['title'].upper()
        print(f"✓ GET /api/events/uts-rio returns: {event['title']}")
    
    def test_casa_warner_event(self):
        """GET /api/events/casa-warner should return Casa Warner event"""
        response = requests.get(f"{BASE_URL}/api/events/casa-warner")
        assert response.status_code == 200
        event = response.json()
        assert event['slug'] == 'casa-warner'
        assert 'CASA WARNER' in event['title'].upper()
        print(f"✓ GET /api/events/casa-warner returns: {event['title']}")


class TestCarouselEndpoint:
    """Tests for /api/carousel endpoint - 16 slides with BTS first"""
    
    def test_get_carousel_returns_16_slides(self):
        """GET /api/carousel should return 16 slides"""
        response = requests.get(f"{BASE_URL}/api/carousel")
        assert response.status_code == 200
        slides = response.json()
        assert isinstance(slides, list)
        assert len(slides) == 16, f"Expected 16 slides, got {len(slides)}"
        print(f"✓ GET /api/carousel returns {len(slides)} slides")
    
    def test_carousel_bts_is_first(self):
        """First slide should be BTS World Tour Arirang"""
        response = requests.get(f"{BASE_URL}/api/carousel")
        assert response.status_code == 200
        slides = response.json()
        first_slide = slides[0]
        assert first_slide['slug'] == 'bts-world-tour-arirang', f"Expected BTS first, got {first_slide.get('slug')}"
        assert 'BTS' in first_slide['title'], f"Expected BTS in title, got {first_slide['title']}"
        print(f"✓ First slide is BTS: {first_slide['title']}")
    
    def test_carousel_slides_have_required_fields(self):
        """All slides should have image and title fields"""
        response = requests.get(f"{BASE_URL}/api/carousel")
        assert response.status_code == 200
        slides = response.json()
        for i, slide in enumerate(slides):
            assert 'image' in slide, f"Slide {i} missing 'image'"
            assert 'title' in slide, f"Slide {i} missing 'title'"
            assert slide['image'], f"Slide {i} has empty image"
        print(f"✓ All {len(slides)} slides have required fields")


class TestEventsEndpoint:
    """Tests for /api/events endpoint - now 24+ events"""
    
    def test_get_all_events_returns_many(self):
        """GET /api/events should return 24+ seeded events"""
        response = requests.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        events = response.json()
        assert isinstance(events, list)
        assert len(events) >= 24, f"Expected at least 24 events, got {len(events)}"
        print(f"✓ GET /api/events returns {len(events)} events")
    
    def test_events_have_required_fields(self):
        """Events should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        events = response.json()
        required_fields = ['id', 'slug', 'title', 'artist', 'category', 'city', 
                          'venue', 'date', 'date_label', 'price_from', 'image', 
                          'poster', 'description', 'featured']
        for event in events:
            for field in required_fields:
                assert field in event, f"Missing field '{field}' in event {event.get('title', 'unknown')}"
        print(f"✓ All {len(events)} events have required fields")
    
    def test_get_featured_events(self):
        """GET /api/events?featured=true should return featured events"""
        response = requests.get(f"{BASE_URL}/api/events", params={"featured": "true"})
        assert response.status_code == 200
        events = response.json()
        assert len(events) >= 4, f"Expected at least 4 featured events, got {len(events)}"
        for event in events:
            assert event['featured'] == True, f"Event {event['title']} is not featured"
        print(f"✓ GET /api/events?featured=true returns {len(events)} featured events")
    
    def test_filter_by_category_show(self):
        """GET /api/events?category=show should return show category events"""
        response = requests.get(f"{BASE_URL}/api/events", params={"category": "show"})
        assert response.status_code == 200
        events = response.json()
        assert len(events) >= 9, f"Expected at least 9 show events, got {len(events)}"
        for event in events:
            assert event['category'] == 'show', f"Event {event['title']} has category {event['category']}, expected 'show'"
        print(f"✓ GET /api/events?category=show returns {len(events)} show events")
    
    def test_search_bts(self):
        """GET /api/events?search=bts should return BTS event"""
        response = requests.get(f"{BASE_URL}/api/events", params={"search": "bts"})
        assert response.status_code == 200
        events = response.json()
        assert len(events) >= 1, "Expected at least one event matching 'bts'"
        titles = [e['title'].lower() for e in events]
        assert any('bts' in t for t in titles), f"Expected 'bts' in titles, got {titles}"
        print(f"✓ GET /api/events?search=bts returns {len(events)} events")


class TestVenuesEndpoint:
    """Tests for /api/venues endpoint"""
    
    def test_get_all_venues_returns_8(self):
        """GET /api/venues should return 8 seeded venues"""
        response = requests.get(f"{BASE_URL}/api/venues")
        assert response.status_code == 200
        venues = response.json()
        assert isinstance(venues, list)
        assert len(venues) == 8, f"Expected 8 venues, got {len(venues)}"
        print(f"✓ GET /api/venues returns {len(venues)} venues")
    
    def test_venues_have_required_fields(self):
        """Venues should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/venues")
        assert response.status_code == 200
        venues = response.json()
        required_fields = ['id', 'name', 'city', 'image', 'event_count']
        for venue in venues:
            for field in required_fields:
                assert field in venue, f"Missing field '{field}' in venue {venue.get('name', 'unknown')}"
        print(f"✓ All {len(venues)} venues have required fields")


class TestEventDetailEndpoint:
    """Tests for /api/events/{slug} endpoint"""
    
    def test_get_event_by_slug_the_weeknd(self):
        """GET /api/events/the-weeknd should return full event details"""
        response = requests.get(f"{BASE_URL}/api/events/the-weeknd")
        assert response.status_code == 200
        event = response.json()
        assert event['slug'] == 'the-weeknd'
        assert event['title'] == 'THE WEEKND'
        print(f"✓ GET /api/events/the-weeknd returns event: {event['title']}")
    
    def test_get_nonexistent_event_returns_404(self):
        """GET /api/events/nonexistent should return 404"""
        response = requests.get(f"{BASE_URL}/api/events/nonexistent-event-xyz")
        assert response.status_code == 404
        data = response.json()
        assert 'detail' in data
        print(f"✓ GET /api/events/nonexistent returns 404 with detail: {data['detail']}")


class TestDestaquesEndpoint:
    """Tests for /api/destaques endpoint - 9 destaques matching original Ticketmaster layout"""
    
    def test_get_destaques_returns_9(self):
        """GET /api/destaques should return 9 destaques"""
        response = requests.get(f"{BASE_URL}/api/destaques")
        assert response.status_code == 200
        destaques = response.json()
        assert isinstance(destaques, list)
        assert len(destaques) == 9, f"Expected 9 destaques, got {len(destaques)}"
        print(f"✓ GET /api/destaques returns {len(destaques)} destaques")
    
    def test_destaques_correct_order(self):
        """Destaques should be in correct order matching original Ticketmaster print"""
        response = requests.get(f"{BASE_URL}/api/destaques")
        assert response.status_code == 200
        destaques = response.json()
        expected_titles = [
            "Jackson Wang - São Paulo - 23/04/2026 - Venda Geral",
            "La Lom | Queremos! - São Paulo - Venda Geral",
            "Turnê Três Graças",
            "Henry & Klauss: Masters of Magic World Tour 2026",
            "Lenine - Tokio Marine Hall - 30/05/2026",
            "Nubya Garcia Queremos! - São Paulo",
            "Rolex 6 Horas de São Paulo",
            "Eagle-Eye Cherry - Tokio Marine Hall - 25/07/2026",
            "SP2B - São Paulo Beyond Business"
        ]
        actual_titles = [d['title'] for d in destaques]
        assert actual_titles == expected_titles, f"Order mismatch: {actual_titles}"
        print(f"✓ Destaques in correct order")
    
    def test_destaques_have_required_fields(self):
        """Each destaque should have venue, title, date, image, slug"""
        response = requests.get(f"{BASE_URL}/api/destaques")
        assert response.status_code == 200
        destaques = response.json()
        required_fields = ['venue', 'title', 'date', 'image', 'slug']
        for dest in destaques:
            for field in required_fields:
                assert field in dest, f"Missing field '{field}' in destaque {dest.get('title', 'unknown')}"
        print(f"✓ All {len(destaques)} destaques have required fields")
    
    def test_destaques_images_start_with_destaques_path(self):
        """All destaque images should start with /destaques/"""
        response = requests.get(f"{BASE_URL}/api/destaques")
        assert response.status_code == 200
        destaques = response.json()
        for dest in destaques:
            assert dest['image'].startswith('/destaques/'), f"Image path should start with /destaques/: {dest['image']}"
        print(f"✓ All destaque images have correct path prefix")
    
    def test_destaques_venues_correct(self):
        """Destaques should have correct venues matching original Ticketmaster"""
        response = requests.get(f"{BASE_URL}/api/destaques")
        assert response.status_code == 200
        destaques = response.json()
        expected_venues = [
            "Suhai Music Hall",
            "Casa Natura Musical",
            "Vibra São Paulo",
            "Teatro Villa Lobos",
            "Tokio Marine Hall",
            "Casa Natura Musical",
            "Autódromo de Interlagos",
            "Tokio Marine Hall",
            "Parque Ibirapuera"
        ]
        actual_venues = [d['venue'] for d in destaques]
        assert actual_venues == expected_venues, f"Venue mismatch: {actual_venues}"
        print(f"✓ Destaques venues correct")
    
    def test_destaques_slugs_present(self):
        """All destaques should have slugs for navigation"""
        response = requests.get(f"{BASE_URL}/api/destaques")
        assert response.status_code == 200
        destaques = response.json()
        expected_slugs = [
            "jackson-wang-sp", "la-lom-sp", "turne-tres-gracas",
            "henry-klauss-masters-of-magic", "lenine-tokio-marine",
            "nubya-garcia-sp", "rolex-6-horas-sp", "eagle-eye-cherry-sp",
            "sp2b-ibirapuera"
        ]
        actual_slugs = [d['slug'] for d in destaques]
        assert actual_slugs == expected_slugs, f"Slug mismatch: {actual_slugs}"
        print(f"✓ Destaques slugs correct: {actual_slugs}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
