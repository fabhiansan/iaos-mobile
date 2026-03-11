import os
import zipfile


def zip_directory(zip_filename):
    # Specify the directory to zip (current directory)
    root_dir = os.getcwd()

    # Function to read .ebinclude from the root directory
    def read_ebinclude():
        ebinclude_path = os.path.join(root_dir, ".ebinclude")
        if os.path.exists(ebinclude_path):
            with open(ebinclude_path, "r") as f:
                return f.read().splitlines()
        else:
            return []

    # Get include patterns from .ebinclude in the root directory
    include_patterns = read_ebinclude()

    # Create a ZipFile object to store the zip archive
    with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as zipf:
        # Function to add files/directories to the zip
        def add_to_zip(path, rel_path):
            if os.path.isdir(path):
                # Add directory and its contents
                for root, dirs, files in os.walk(path):
                    if (
                        "__pycache__" in root
                        or "manager/javascript/node_modules" in root
                        or "web/node_modules" in root
                        or "web/.next" in root
                    ):
                        continue
                    for filename in files:
                        file_path = os.path.join(root, filename)
                        if ".env" in filename:
                            continue
                        if os.path.islink(file_path):
                            zip_info = zipfile.ZipInfo()
                            zip_info.filename = os.path.relpath(file_path, root_dir)
                            zip_info.external_attr = 2716663808
                            zipf.writestr(zip_info, os.readlink(file_path))
                        else:
                            zipf.write(file_path, os.path.relpath(file_path, root_dir))
                    for dirname in dirs:
                        dir_path = os.path.join(root, dirname)
                        if os.path.islink(dir_path):
                            zip_info = zipfile.ZipInfo()
                            zip_info.filename = os.path.relpath(dir_path, root_dir)
                            zip_info.external_attr = 2716663808
                            zipf.writestr(zip_info, os.readlink(dir_path))
            else:
                # Add file
                zipf.write(path, rel_path)

        # Include files/directories matching .ebinclude patterns
        for pattern in include_patterns:
            pattern_path = os.path.join(root_dir, pattern)
            if os.path.exists(pattern_path):
                # Resolve symlink to get actual path
                resolved_path = os.path.realpath(pattern_path)
                if os.path.isdir(resolved_path):
                    add_to_zip(resolved_path, os.path.relpath(resolved_path, root_dir))
                else:
                    add_to_zip(resolved_path, os.path.relpath(pattern_path, root_dir))


# Main function to create the zip archive
def main():
    zip_filename = (
        ".elasticbeanstalk/my-app.zip"  # Specify the name of the zip file to create
    )
    zip_directory(zip_filename)
    print(f"Zip archive {zip_filename} created successfully.")


if __name__ == "__main__":
    main()
