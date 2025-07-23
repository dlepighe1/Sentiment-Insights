import requests
from bs4 import BeautifulSoup
import re

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/115.0 Safari/537.36"
    )
}


def AmazonScraper(link):
    # 1) Download page
    resp = requests.get(link)
    soup = BeautifulSoup(resp.text, "html.parser")

    # 2) Product title
    title_el = soup.find("span", {'id': 'productTitle'}).text.strip()
    print(title_el)
    if not title_el:
        raise ValueError("Amazon: could not find product title")
    product_name = title_el.get_text(strip=True)

    # 3) Reviews
    # Amazon review text lives inside data-hook="review-body"
    review_spans = soup.select("div[data-hook=review] span[data-hook=review-body]")
    if not review_spans:
        raise ValueError("Amazon: no reviews found")
    reviews = [span.get_text(strip=True) for span in review_spans]

    return product_name, reviews


def YelpScraper(link):
    # 1) Download page
    resp = requests.get(link, headers=HEADERS, timeout=10)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    # 2) Business name (Yelp uses <h1> with a CSS class that may change)
    # This tries a few common patterns
    name_el = (
        soup.find("h1", class_=re.compile(r"^css-.*heading--h1.*")) or
        soup.find("h1")
    )
    if not name_el:
        raise ValueError("Yelp: could not find business name")
    product_name = name_el.get_text(strip=True)

    # 3) Reviews
    # Yelp review text often in <p class="raw__373c0__3rcx7">
    review_ps = soup.select("span.raw__373c0__3rcx7, p.comment__373c0__Nsutg")
    if not review_ps:
        raise ValueError("Yelp: no reviews found")
    reviews = [p.get_text(strip=True) for p in review_ps]

    return product_name, reviews
