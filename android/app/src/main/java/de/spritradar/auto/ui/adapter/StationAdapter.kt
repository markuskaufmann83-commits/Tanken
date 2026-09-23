package de.spritradar.auto.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import de.spritradar.auto.R
import de.spritradar.auto.data.model.FuelType
import de.spritradar.auto.data.model.Station
import de.spritradar.auto.databinding.ItemStationBinding

class StationAdapter(
    private var stations: List<Station> = emptyList(),
    private var currentFuelType: FuelType = FuelType.E10,
    private val onNavigateClick: (Station) -> Unit
) : RecyclerView.Adapter<StationAdapter.StationViewHolder>() {

    fun updateData(newStations: List<Station>, fuelType: FuelType) {
        this.stations = newStations
        this.currentFuelType = fuelType
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StationViewHolder {
        val binding = ItemStationBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return StationViewHolder(binding)
    }

    override fun onBindViewHolder(holder: StationViewHolder, position: Int) {
        holder.bind(stations[position], currentFuelType, onNavigateClick)
    }

    override fun getItemCount(): Int = stations.size

    class StationViewHolder(private val binding: ItemStationBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(
            station: Station,
            fuelType: FuelType,
            onNavigateClick: (Station) -> Unit
        ) {
            val context = binding.root.context

            binding.ivBrandLogo.setImageResource(
                de.spritradar.auto.ui.util.BrandLogoHelper.getBrandLogoResId(station.brand, station.name)
            )
            binding.tvName.text = station.name
            binding.tvDistance.text = station.formatDistance()
            binding.tvAddress.text = station.getFullAddress()

            // Open / Closed Status
            if (station.isOpen) {
                binding.tvStatus.text = context.getString(R.string.status_open)
                binding.tvStatus.setTextColor(ContextCompat.getColor(context, R.color.emerald))
            } else {
                binding.tvStatus.text = context.getString(R.string.status_closed)
                binding.tvStatus.setTextColor(ContextCompat.getColor(context, R.color.rose))
            }

            // Formatted price with superscript third digit
            binding.tvPrice.text = station.formatPrice(fuelType)

            binding.btnRoute.setOnClickListener {
                onNavigateClick(station)
            }

            binding.root.setOnClickListener {
                onNavigateClick(station)
            }
        }
    }
}
