class RandomSort {

	// ordering the numbers by comparing first and last item in the list
	public static void RandomSort(int[] arr) {
		int size = arr.length;
		for(int j=0;j<size;j++){
			for(int i=size-1;i>=0;i--){
				if(arr[j] > arr[i]) {
					int temp = arr[j];
					arr[j] = arr[i];
					arr[i] = temp;
				}
			}
		}
	}

	// generating a set of numbers
	public static void main(String[] args) {
		int size = 100;
		int[] data = new int[size];
		for(int i=0; i<size; i++) {
			data[i] = (int) (Math.random() * 100);
		}
		System.out.println("Before sorting: ");
		for(int i=0; i<size; i++) {
			System.out.print(data[i] + " ");
		}

		RandomSort(data);

		System.out.println();
		System.out.println("After sorting: ");
		for(int i=0; i<size; i++) {
			System.out.print(data[i] + " ");
		}
	}

}