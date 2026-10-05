import urllib.parse
import httpx
import logging
from typing import List, Optional
from pydantic import BaseModel
from app.core.config import settings

logger = logging.getLogger("app.services.youtube")


class YouTubePlaylistResource(BaseModel):
    title: str
    url: str
    channel_title: Optional[str] = None
    thumbnail_url: Optional[str] = None


class YouTubeService:
    @classmethod
    async def get_playlists_for_skills(cls, target_skills: List[str], topic_title: str) -> List[YouTubePlaylistResource]:
        """
        Fetches or constructs YouTube playlist resources for a given set of skills/topics.
        Uses YouTube Data API v3 if YOUTUBE_API_KEY is configured in settings/env,
        otherwise falls back to smart YouTube playlist search link generation.
        """
        api_key = getattr(settings, "YOUTUBE_API_KEY", None)
        query_terms = target_skills[:2] if target_skills else [topic_title]
        query_str = " ".join(query_terms)

        if api_key:
            try:
                playlists = await cls._fetch_from_api(query_str, api_key)
                if playlists:
                    return playlists
            except Exception as e:
                logger.warning(f"YouTube API call failed ({e}), falling back to direct playlist search links.")

        # Default / Zero-Key Fallback (No API key needed)
        return cls._generate_smart_search_links(target_skills, topic_title)

    @classmethod
    async def _fetch_from_api(cls, query: str, api_key: str) -> List[YouTubePlaylistResource]:
        search_query = f"{query} full course playlist tutorial"
        params = {
            "part": "snippet",
            "type": "playlist",
            "q": search_query,
            "maxResults": 2,
            "key": api_key
        }
        url = "https://www.googleapis.com/youtube/v3/search"
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url, params=params)
            if res.status_code == 200:
                data = res.json()
                items = data.get("items", [])
                results = []
                for item in items:
                    playlist_id = item.get("id", {}).get("playlistId")
                    snippet = item.get("snippet", {})
                    if playlist_id:
                        title = snippet.get("title", f"{query} Playlist")
                        channel = snippet.get("channelTitle", "YouTube Channel")
                        thumb = (
                            snippet.get("thumbnails", {}).get("high", {}).get("url")
                            or snippet.get("thumbnails", {}).get("default", {}).get("url")
                        )
                        results.append(YouTubePlaylistResource(
                            title=title,
                            url=f"https://www.youtube.com/playlist?list={playlist_id}",
                            channel_title=channel,
                            thumbnail_url=thumb
                        ))
                return results
        return []

    @classmethod
    def _generate_smart_search_links(cls, target_skills: List[str], topic_title: str) -> List[YouTubePlaylistResource]:
        results = []
        skills_to_search = target_skills[:2] if target_skills else [topic_title]

        for skill in skills_to_search:
            clean_skill = skill.strip()
            encoded_query = urllib.parse.quote(f"{clean_skill} full course playlist tutorial")
            # sp=EgIQAw%253D%253D is YouTube's URL filter parameter for Playlists
            playlist_search_url = f"https://www.youtube.com/results?search_query={encoded_query}&sp=EgIQAw%253D%253D"
            results.append(YouTubePlaylistResource(
                title=f"{clean_skill} — Top YouTube Playlists",
                url=playlist_search_url,
                channel_title="YouTube Curated Playlists",
                thumbnail_url=None
            ))
        return results
