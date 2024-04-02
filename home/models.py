from wagtail.api import APIField
from wagtail.models import Page
from wagtail.fields import RichTextField
from wagtail.admin.panels import FieldPanel


class HomePage(Page):
    body = RichTextField(blank=True)

    api_fields = [
        APIField("body"),
    ]

    content_panels = Page.content_panels + [
        FieldPanel("body"),
    ]
