"""Dependency injection for FastAPI routes."""

from .services.demo_service import demo_service


def get_demo_service():
    """Get the demo service singleton."""
    return demo_service
