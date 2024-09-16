import requests
import os


api_key = '-j5-lJg39jzjsR5eOxH0rBNoiemiDv_6xg-EcMXGjWw' # remove before commiting to production
dir_images = 'wildlife_images'
num_images = 30 # unsplash limits to 30

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

def main():
    create_directory(dir_images)
    images = fetch_random_wildlife_images(num_images, api_key)
    
    for idx, image in enumerate(images):
        image_url = image['urls']['regular']  # 'raw', 'full', 'regular', 'small', 'thumb'
        image_path = os.path.join(dir_images, f'wildlife_{idx+1}.jpg')
        download_image(image_url, image_path)

if __name__ == '__main__':
    main()
