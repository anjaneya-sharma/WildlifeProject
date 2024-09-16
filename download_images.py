import requests
import os

api_key = 'QNckYJVhmc8HKXfLg0Hng1vA7u5KWFCNUlVRt4dTRCk'  # Remove before committing to production
dir_images = r'C:\Users\ameyd\Desktop\IIITD\SEM 7\btp\my_project\frontend\public\assets\wildlife_images'
num_images = 30  # Unsplash limits to 30

def create_directory(path):
    if not os.path.exists(path):
        os.makedirs(path)

def download_image(url, file_path):
    try:
        response = requests.get(url)
        response.raise_for_status()
        with open(file_path, 'wb') as file:
            file.write(response.content)
        print(f'Successfully downloaded: {file_path}')
    except Exception as e:
        print(f'Error downloading {file_path}: {e}')

def fetch_random_wildlife_images(num_images, access_key):
    url = f'https://api.unsplash.com/photos/random?count={num_images}&query=wildlife&client_id={access_key}'
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f'Error fetching images: {e}')
        return []

def get_latest_suffix(directory):
    existing_files = [f for f in os.listdir(directory) if f.startswith('wildlife_') and f.endswith('.jpg')]
    if not existing_files:
        return 0
    latest_suffix = max(int(f.split('_')[1].split('.')[0]) for f in existing_files)
    return latest_suffix

def main():
    create_directory(dir_images)
    images = fetch_random_wildlife_images(num_images, api_key)
    
    latest_suffix = get_latest_suffix(dir_images)
    
    for idx, image in enumerate(images):
        image_url = image['urls']['regular']
        image_path = os.path.join(dir_images, f'wildlife_{latest_suffix + idx + 1}.jpg')
        download_image(image_url, image_path)

if __name__ == '__main__':
    main()