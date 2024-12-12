import cv2
import numpy as np
from matplotlib import pyplot as plt

def sift_matching(image1_path, image2_path):
    # Load images
    img1 = cv2.imread(image1_path, cv2.IMREAD_GRAYSCALE)  # Query image
    img2 = cv2.imread(image2_path, cv2.IMREAD_GRAYSCALE)  # Train image

    if img1 is None or img2 is None:
        raise ValueError("Could not open or find the images!")

    # Initialize SIFT detector
    sift = cv2.SIFT_create()

    # Detect and compute keypoints and descriptors
    keypoints1, descriptors1 = sift.detectAndCompute(img1, None)
    keypoints2, descriptors2 = sift.detectAndCompute(img2, None)

    # Initialize a Brute Force matcher
    bf = cv2.BFMatcher(cv2.NORM_L2, crossCheck=True)

    # Match descriptors
    matches = bf.match(descriptors1, descriptors2)

    # Sort matches by distance (best matches first)
    matches = sorted(matches, key=lambda x: x.distance)

    # Draw matches
    matching_result = cv2.drawMatches(img1, keypoints1, img2, keypoints2, matches[:50], None, flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)

    # Display the resulting image
    plt.figure(figsize=(15, 10))
    plt.imshow(matching_result)
    plt.title('SIFT Matching')
    plt.axis('off')
    plt.show()

    return matching_result

# Example usage
image1_path = '../../public/assets/wildlife_images/Tiger1.jpg'  # Replace with the path to your first image
image2_path = '../../public/assets/wildlife_images/Tiger1.jpg'  # Replace with the path to your second image

sift_matching(image1_path, image2_path)
