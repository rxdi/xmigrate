LAST_COMMIT_MESSAGE=$(git log -1 --pretty=%B)

if [[ ! $LAST_COMMIT_MESSAGE =~ "[SKIP]" ]]
then
   echo "It's there!"
fi